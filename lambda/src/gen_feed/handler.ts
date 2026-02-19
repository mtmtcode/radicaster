import { S3Client } from '@aws-sdk/client-s3';
import { S3Storage } from './s3';
import { generateFeed } from './feedGenerator';

const s3Client = new S3Client({});
const bucket = process.env.RADICASTER_S3_BUCKET!;
const bucketUrl = process.env.RADICASTER_BUCKET_URL!;

const storage = new S3Storage(s3Client, bucket, bucketUrl);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractId(event: any): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let records: any[] = event.Records;

  // SNSイベントにS3イベントがラップされている場合はアンラップする
  if (records[0].Sns) {
    const snsMessage = JSON.parse(records[0].Sns.Message as string);
    records = snsMessage.Records;
  }

  const s3Record = records[0];
  if (!s3Record.s3) {
    throw new Error('"s3" is not contained in the event');
  }

  // S3イベントのキーはURLエンコードされている
  const key = decodeURIComponent((s3Record.s3.object.key as string).replace(/\+/g, ' '));
  return key.split('/')[0];
}

/** CloudWatch/SNSイベントをハンドルしてPodcastフィードを生成する */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handler(event: any): Promise<void> {
  console.log('Start event handling.');

  const id = extractId(event);
  console.debug(`id: ${id}`);

  const definition = await storage.findDefinition(id);
  const episodes = await storage.listEpisodes(id);
  const feed = generateFeed(definition, episodes);
  await storage.saveFeed(id, feed);

  console.log('Event handling finished.');
}
