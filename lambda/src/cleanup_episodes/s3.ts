import {
  S3Client,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import * as yaml from 'js-yaml';
import { Definition, Episode } from './types';

const EPISODE_EXT = '.m4a';

/** S3ストレージ操作クラス */
export class S3Storage {
  constructor(
    private readonly client: S3Client,
    private readonly bucket: string,
  ) {}

  /** 番組定義YAMLを読み込む。存在しない場合はnullを返す */
  async findDefinition(id: string): Promise<Definition | null> {
    const key = `radicaster/${id}.yaml`;
    try {
      const resp = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      const body = await resp.Body!.transformToString();
      return yaml.load(body) as Definition;
    } catch (err) {
      if ((err as { name?: string }).name === 'NoSuchKey') return null;
      throw err;
    }
  }

  /** エピソード一覧をキーの昇順で返す */
  async listEpisodes(id: string): Promise<Episode[]> {
    const prefix = `${id}/data/`;
    const resp = await this.client.send(
      new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix }),
    );
    const contents = resp.Contents ?? [];

    return contents
      .filter(obj => obj.Key!.toLowerCase().endsWith(EPISODE_EXT))
      .map(obj => ({ key: obj.Key! }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }

  /** エピソードを削除する */
  async deleteEpisode(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
