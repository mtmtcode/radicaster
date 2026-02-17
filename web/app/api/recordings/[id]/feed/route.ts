import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { XMLParser } from "fast-xml-parser";

const s3Client = new S3Client({});

interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
  enclosure?: {
    url: string;
    length: string;
    type: string;
  };
  duration?: string; // itunes:duration
  guid?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const bucketName = process.env.RADICASTER_S3_BUCKET;
  if (!bucketName) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: `${id}/index.rss`,
    });

    const response = await s3Client.send(command);
    const xmlText = await response.Body?.transformToString();

    if (!xmlText) {
      // Return empty list if file is empty or not found (though S3 usually throws 404)
      return NextResponse.json({ items: [] });
    }

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
    });
    const parsed = parser.parse(xmlText);

    const channel = parsed.rss?.channel;
    if (!channel) {
      return NextResponse.json({ items: [] });
    }

    // items can be single object or array
    let items = channel.item || [];
    if (!Array.isArray(items)) {
      items = [items];
    }

    const feedItems = await Promise.all(items.map(async (item: any) => {
      let enclosureUrl = item.enclosure?.url;

      // Generate signed URL if needed
      // Assuming S3 key structure based on enclosure URL or id
      if (enclosureUrl) {
        try {
          // Extract filename or key. The key format is [id]/data/[filename]
          // Example url: https://.../baka/data/20260217.m4a
          // We can extract everything after the last slash as filename
          const filename = enclosureUrl.split('/').pop();
          if (filename && id) {
            const key = `${id}/data/${filename}`;
            const command = new GetObjectCommand({
              Bucket: bucketName,
              Key: key,
            });
            // URL expires in 1 hour
            enclosureUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
          }
        } catch (e) {
          console.error("Failed to sign URL:", e);
          // fallback to original URL
        }
      }

      return {
        title: item.title,
        description: item.description,
        pubDate: item.pubDate,
        link: item.link,
        enclosure: item.enclosure ? {
          url: enclosureUrl,
          length: item.enclosure.length,
          type: item.enclosure.type,
        } : null,
        duration: item["itunes:duration"],
        guid: item.guid?.["#text"] || item.guid,
      };
    }));

    return NextResponse.json({
      title: channel.title,
      description: channel.description,
      items: feedItems,
    });

  } catch (error: any) {
    if (error.name === 'NoSuchKey') {
      // No feed yet, which is not an error for the user, just empty state
      return NextResponse.json({ items: [] });
    }
    console.error(`Error fetching feed for ${id}:`, error);
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
  }
}
