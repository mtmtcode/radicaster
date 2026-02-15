import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { EventBridgeClient, PutRuleCommand, PutTargetsCommand, ListRulesCommand } from "@aws-sdk/client-eventbridge";
import * as yaml from "js-yaml";
import { z } from "zod";
import { ExecutionSchedule } from "@/lib/radicaster/schedule";
import { createRecording } from "@/lib/radicaster/actions";

const s3Client = new S3Client({});
const eventBridgeClient = new EventBridgeClient({});

const scheduleSchema = z.string().regex(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s*([0-5]?[0-9]):([0-5]?[0-9])(?::([0-5]?[0-9]))?$/i);

const requestSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9_-]+$/),
  title: z.string().min(1),
  author: z.string().min(1),
  area: z.string().min(1),
  station: z.string().min(1),
  duration: z.number().min(1),
  program_schedule: z.array(z.string().min(1)),
  execution_schedule: z.array(scheduleSchema),
  retention_type: z.enum(["none", "count", "days"]).optional(),
  retention_value: z.number().min(1).optional(),
});

export async function GET() {
  try {
    const bucketName = process.env.RADICASTER_S3_BUCKET;
    if (!bucketName) {
      return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

    // 1. Fetch S3 Objects
    const s3Command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: "radicaster/",
    });
    const s3Response = await s3Client.send(s3Command);
    const s3Items = new Map<string, any>(); // id -> content

    if (s3Response.Contents) {
      await Promise.all(s3Response.Contents.map(async (item) => {
        if (!item.Key?.endsWith(".yaml")) return;

        try {
          const getObj = new GetObjectCommand({ Bucket: bucketName, Key: item.Key });
          const res = await s3Client.send(getObj);
          const str = await res.Body?.transformToString();
          if (str) {
            const parsed = yaml.load(str) as any;
            if (parsed && parsed.id) {
              // Try to fetch image URL from RSS
              try {
                const rssKey = `${parsed.id}/index.rss`;
                const rssObj = await s3Client.send(new GetObjectCommand({ Bucket: bucketName, Key: rssKey }));
                const rssStr = await rssObj.Body?.transformToString();
                if (rssStr) {
                  // Simple regex to find <itunes:image href="...">
                  const match = rssStr.match(/<itunes:image href="([^"]+)"/);
                  if (match && match[1]) {
                    parsed.imageUrl = match[1];
                  }
                }
              } catch (e) {
                // Ignore RSS fetch errors (no feed yet, etc)
              }
              s3Items.set(parsed.id, parsed);
            }
          }
        } catch (e) {
          console.error(`Failed to read ${item.Key}`, e);
        }
      }));
    }

    // 2. Fetch EventBridge Rules
    // Note: This lists all rules in the account/region. Might want to filter by prefix if possible, or just parse all.
    // ListRulesCommand has NamePrefix.
    // Rule naming convention: `${id}_${index}`.
    // Since IDs are custom, we can't strictly filter by a single prefix unless we enforce one.
    // However, user IDs are likely diverse.
    // For now, let's list all rules and filter by those that look like our pattern or targets.
    // A better approach might be to just assume we check against what we found in S3, 
    // BUT we need to find "EventBridge Only" items (orphans).
    // So we should iterate all rules and see if they look like ours.
    // Or, if we can assume all rules starting with valid ID chars are ours? No, too risky.
    // Maybe we filter rules that target `rec-radiko`.
    // But ListRules doesn't return Targets.
    // Compromise: Since we don't have a strict prefix for ALL rules (only custom IDs),
    // we might need to rely on the user to keep the namespace clean, or just check rules that START with known IDs from S3?
    // S3-only is easy.
    // EventBridge-only is hard without a common prefix.
    // Wait, the previous logic (Ruby CLI) or existing logic names rules as `id_index`.
    // If I list all rules, I might get too many unrelated rules.
    // If I can't find EventBridge-only easily without scanning everything, maybe I skip that for now or 
    // just scan "reasonable" amount.
    // Actually, I can list rules and check if the name matches `.+_\d+`.

    const ebCommand = new ListRulesCommand({ Limit: 100 }); // Pagination might be needed if many rules
    const ebResponse = await eventBridgeClient.send(ebCommand);
    const ebRules = new Map<string, string[]>(); // id -> [cron expressions]

    if (ebResponse.Rules) {
      for (const rule of ebResponse.Rules) {
        if (!rule.Name) continue;
        // distinct ID from Name (last underscore is separation?)
        // Name is `id_index`.
        const lastUnderscore = rule.Name.lastIndexOf("_");
        if (lastUnderscore === -1) continue;

        const id = rule.Name.substring(0, lastUnderscore);
        const suffix = rule.Name.substring(lastUnderscore + 1);
        if (!/^\d+$/.test(suffix)) continue; // Not our pattern likely

        if (!ebRules.has(id)) {
          ebRules.set(id, []);
        }
        if (rule.ScheduleExpression) {
          ebRules.get(id)?.push(rule.ScheduleExpression);
        }
      }
    }

    // 3. Correlate
    const recordings = [];
    const allIds = new Set([...s3Items.keys(), ...ebRules.keys()]);

    for (const id of allIds) {
      const s3 = s3Items.get(id);
      const eb = ebRules.get(id);

      let status = "healthy";
      if (s3 && !eb) status = "s3_only";
      else if (!s3 && eb) status = "eventbridge_only";
      else if (s3 && eb) {
        // Check if count matches? Or simple existence is enough for "healthy" for now.
        // Maybe check if definitions match?
        // s3.execution_schedule is array of cron-like strings? or schedule objects?
        // In YAML it's strings like "Mon 12:00". In EB it's "cron(...)".
        // Hard to compare exactly without parsing logic.
        // Let's stick to existence check for now.
        status = "healthy";
      }

      recordings.push({
        id,
        status,
        title: s3?.title || id,
        station: s3?.station,
        imageUrl: s3?.imageUrl,
        schedules: s3?.execution_schedule || eb || [],
      });
    }

    // Sort
    recordings.sort((a, b) => a.id.localeCompare(b.id));

    return NextResponse.json({ recordings });

  } catch (error: any) {
    console.error("Error fetching recordings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const dataJson = formData.get("data") as string;
    const imageFile = formData.get("image") as File | null;

    if (!dataJson) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const body = JSON.parse(dataJson);
    const data = requestSchema.parse(body);

    await createRecording({
      ...data,
      imageFile: imageFile || undefined
    });

    return NextResponse.json({ success: true, id: data.id });
  } catch (error: any) {
    console.error("Error processing request:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: (error as any).issues || (error as any).errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
