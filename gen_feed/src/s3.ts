import {
  S3Client,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { Definition, Episode } from './types';

const FEED_FILENAME = 'index.rss';
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png'];
const EPISODE_EXTS = ['.m4a'];

/** S3ストレージ操作クラス */
export class S3Storage {
  constructor(
    private readonly client: S3Client,
    private readonly bucket: string,
    private readonly url: string,
  ) {}

  async findDefinition(id: string): Promise<Definition> {
    const key = `radicaster/${id}.yaml`;
    const resp = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const body = await resp.Body!.transformToString();
    const defHash = yaml.load(body) as Record<string, string>;

    const imageUrl = (await this.findImage(id)) ?? defHash['image'];

    return {
      title: defHash['title'],
      author: defHash['author'],
      summary: defHash['summary'],
      image: imageUrl,
    };
  }

  async listEpisodes(id: string): Promise<Episode[]> {
    const prefix = `${id}/data/`;
    const resp = await this.client.send(
      new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix }),
    );
    const contents = resp.Contents ?? [];

    return contents
      .filter(obj => EPISODE_EXTS.includes(path.extname(obj.Key!).toLowerCase()))
      .map(obj => ({
        url: this.buildPublicUrl(obj.Key!),
        size: obj.Size!,
        lastModified: obj.LastModified!,
        title: obj.Key!.split('/').pop()!,
      }))
      .sort((a, b) => b.title.localeCompare(a.title));
  }

  async saveFeed(id: string, feedBody: string): Promise<void> {
    const key = `${id}/${FEED_FILENAME}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: feedBody,
        ContentType: 'application/rss+xml',
        CacheControl: 'no-cache',
      }),
    );
  }

  private buildPublicUrl(key: string): string {
    return `${this.url}/${key}`;
  }

  private async findImage(id: string): Promise<string | undefined> {
    const resp = await this.client.send(
      new ListObjectsV2Command({ Bucket: this.bucket, Prefix: `radicaster/${id}.` }),
    );
    const contents = resp.Contents ?? [];

    for (const obj of contents) {
      const ext = path.extname(obj.Key!).toLowerCase();
      if (IMAGE_EXTS.includes(ext)) {
        // 画像URLからBasic認証クレデンシャルを除去する
        const imageUrl = new URL(this.buildPublicUrl(obj.Key!));
        imageUrl.username = '';
        imageUrl.password = '';
        return imageUrl.toString();
      }
    }
    return undefined;
  }
}
