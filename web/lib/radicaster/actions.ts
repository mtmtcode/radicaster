import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import {
  EventBridgeClient,
  PutRuleCommand,
  PutTargetsCommand,
  ListRulesCommand,
  RemoveTargetsCommand,
  DeleteRuleCommand,
} from "@aws-sdk/client-eventbridge";
import * as yaml from "js-yaml";
import { ExecutionSchedule } from "@/lib/radicaster/schedule";

const s3Client = new S3Client({});
const eventBridgeClient = new EventBridgeClient({});

export interface RecordingData {
  id: string;
  title: string;
  author: string;
  area: string;
  station: string;
  duration: number;
  program_schedule: string[];
  execution_schedule: string[];
  imageFile?: File; // Optional for updates if not changing
}

export type RecordingStatus = "healthy" | "s3_only" | "eventbridge_only" | "error";

export interface RecordingSummary {
  id: string;
  status: RecordingStatus;
  schedules: string[];
  title?: string;
  station?: string;
  imageUrl?: string;
}

export async function getRecording(id: string): Promise<any> {
  const bucketName = process.env.RADICASTER_S3_BUCKET;
  if (!bucketName) throw new Error("RADICASTER_S3_BUCKET is not set");

  try {
    const getObj = new GetObjectCommand({ Bucket: bucketName, Key: `radicaster/${id}.yaml` });
    const res = await s3Client.send(getObj);
    const str = await res.Body?.transformToString();
    if (!str) return null;

    const parsed: any = yaml.load(str);

    // Try to fetch image URL from RSS if not present? Or construct it?
    // Actually for the "Edit" form, we don't display the current image yet
    // but we might want to.
    // For now, let's just return the parsed YAML content.
    return parsed;
  } catch (e: any) {
    if (e.name === 'NoSuchKey') return null;
    throw e;
  }
}

export async function deleteRecording(id: string): Promise<string[]> {
  const bucketName = process.env.RADICASTER_S3_BUCKET;
  if (!bucketName) throw new Error("RADICASTER_S3_BUCKET is not set");

  const errors: string[] = [];

  // 1. Delete S3 Object
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: `radicaster/${id}.yaml`,
      })
    );
    // Also delete artwork if we can guess the extension? 
    // The previous implementation dind't delete artwork explicitly in DELETE route?
    // Wait, the DELETE route just deleted `radicaster/${id}.yaml`.
    // It didn't delete the image.
    // But creation uploads `radicaster/${id}.jpg` or `.png`.
    // We should probably delete that too.
    // Let's try deleting both jpg and png to be safe.
    try {
      await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: `radicaster/${id}.jpg` }));
    } catch { }
    try {
      await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: `radicaster/${id}.png` }));
    } catch { }

  } catch (error: any) {
    console.error(`Failed to delete S3 object for ${id}:`, error);
    // Continue cleanup even if S3 fails
  }

  // 2. Delete EventBridge Rules
  try {
    const rulesToDelete: string[] = [];
    let nextToken: string | undefined;

    do {
      const cmd: ListRulesCommand = new ListRulesCommand({
        NamePrefix: `${id}_`,
        Limit: 50,
        NextToken: nextToken,
      });
      const response = await eventBridgeClient.send(cmd);

      if (response.Rules) {
        const ruleRegex = new RegExp(`^${id}_\\d+$`);
        for (const rule of response.Rules) {
          if (rule.Name && ruleRegex.test(rule.Name)) {
            rulesToDelete.push(rule.Name);
          }
        }
      }
      nextToken = response.NextToken;
    } while (nextToken);

    for (const ruleName of rulesToDelete) {
      try {
        await eventBridgeClient.send(
          new RemoveTargetsCommand({
            Rule: ruleName,
            Ids: ["rec-radiko"],
          })
        );
      } catch (e) {
        console.warn(`Failed to remove targets for ${ruleName}`, e);
      }

      try {
        await eventBridgeClient.send(
          new DeleteRuleCommand({
            Name: ruleName,
          })
        );
      } catch (e: any) {
        console.error(`Failed to delete rule ${ruleName}:`, e);
        errors.push(`Failed to delete rule ${ruleName}`);
      }
    }
  } catch (error: any) {
    console.error(`Failed to process EventBridge rules for ${id}:`, error);
    errors.push(`EventBridge cleanup failed: ${error.message}`);
  }

  return errors;
}

export async function createRecording(data: RecordingData): Promise<void> {
  const bucketName = process.env.RADICASTER_S3_BUCKET;
  const recRadikoArn = process.env.RADICASTER_REC_RADIKO_ARN;

  if (!bucketName || !recRadikoArn) {
    throw new Error("Server configuration error: Missing environment variables");
  }

  // 1. Generate YAML
  const executionSchedules = data.execution_schedule.map((s) => ExecutionSchedule.parse(s));

  const yamlContent = yaml.dump({
    id: data.id,
    title: data.title,
    station: data.station,
    area: data.area,
    author: data.author,
    duration: data.duration,
    program_schedule: data.program_schedule,
    execution_schedule: executionSchedules.map((s) => s.toYamlString()),
  });

  // 2. Upload to S3
  // Upload YAML
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: `radicaster/${data.id}.yaml`,
      Body: yamlContent,
      ContentType: "application/x-yaml",
    })
  );

  // Upload Image if present
  if (data.imageFile) {
    const arrayBuffer = await data.imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let ext = "jpg";
    if (data.imageFile.type === "image/png") ext = "png";
    else if (data.imageFile.type === "image/jpeg") ext = "jpg";

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: `radicaster/${data.id}.${ext}`,
        Body: buffer,
        ContentType: data.imageFile.type,
      })
    );
  }

  // 3. Register EventBridge Rules
  for (let i = 0; i < executionSchedules.length; i++) {
    const schedule = executionSchedules[i];
    const ruleName = `${data.id}_${i}`;
    const cronExpression = schedule.toCron();

    // Put Rule
    await eventBridgeClient.send(
      new PutRuleCommand({
        Name: ruleName,
        ScheduleExpression: cronExpression,
        State: "ENABLED",
      })
    );

    // Put Target
    await eventBridgeClient.send(
      new PutTargetsCommand({
        Rule: ruleName,
        Targets: [
          {
            Id: "rec-radiko",
            Arn: recRadikoArn,
            Input: JSON.stringify({ id: data.id }),
          }
        ]
      })
    );
  }
}
