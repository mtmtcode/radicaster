import { S3Client } from '@aws-sdk/client-s3';
import { S3Storage } from './s3';

const s3Client = new S3Client({});
const bucket = process.env.RADICASTER_S3_BUCKET!;

const storage = new S3Storage(s3Client, bucket);

// ファイル名から日付を抽出する正規表現 (YYYYMMDD.m4a)
const DATE_PATTERN = /(\d{8})\.m4a$/i;

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
  // key format: {id}/data/{YYYYMMDD}.m4a
  return key.split('/')[0];
}

function extractDate(key: string): Date | null {
  const match = key.match(DATE_PATTERN);
  if (!match) return null;
  const dateStr = match[1];
  const year = parseInt(dateStr.slice(0, 4), 10);
  const month = parseInt(dateStr.slice(4, 6), 10) - 1;
  const day = parseInt(dateStr.slice(6, 8), 10);
  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) return null;
  return date;
}

async function cleanupByCount(id: string, keepCount: number): Promise<void> {
  const episodes = await storage.listEpisodes(id);
  console.log(`Found ${episodes.length} episodes for id: ${id}, keeping last ${keepCount}`);

  if (episodes.length <= keepCount) return;

  // ファイル名（日付）昇順にソートされているので先頭の古いものを削除する
  const toDelete = episodes.slice(0, episodes.length - keepCount);
  for (const ep of toDelete) {
    console.log(`Deleting old episode: ${ep.key}`);
    await storage.deleteEpisode(ep.key);
  }
  console.log(`Deleted ${toDelete.length} episodes for id: ${id}`);
}

async function cleanupByDays(id: string, keepDays: number): Promise<void> {
  const episodes = await storage.listEpisodes(id);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - keepDays);
  cutoff.setHours(0, 0, 0, 0);
  console.log(
    `Found ${episodes.length} episodes for id: ${id}, deleting before ${cutoff.toISOString().slice(0, 10)}`,
  );

  let deletedCount = 0;
  for (const ep of episodes) {
    const epDate = extractDate(ep.key);
    if (!epDate) continue;

    if (epDate < cutoff) {
      console.log(`Deleting old episode: ${ep.key} (date: ${epDate.toISOString().slice(0, 10)})`);
      await storage.deleteEpisode(ep.key);
      deletedCount++;
    }
  }
  console.log(`Deleted ${deletedCount} episodes for id: ${id}`);
}

/** SNSイベント（S3アップロード通知）をハンドルして古いエピソードを削除する */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handler(event: any): Promise<void> {
  console.log('Start cleanup episode handling.');

  const id = extractId(event);
  console.debug(`id: ${id}`);

  const definition = await storage.findDefinition(id);
  if (!definition) {
    console.log(`Definition not found for id: ${id}. Skipping.`);
    return;
  }

  const retentionType = definition.retention_type;
  const retentionValue = definition.retention_value;

  if (!retentionType || retentionValue === undefined) {
    console.log(`No retention policy set for id: ${id}. Skipping.`);
    return;
  }

  if (retentionType === 'count') {
    await cleanupByCount(id, retentionValue);
  } else if (retentionType === 'days') {
    await cleanupByDays(id, retentionValue);
  } else {
    console.log(`Unknown retention_type: ${retentionType}. Skipping.`);
  }

  console.log('Cleanup episode handling finished.');
}
