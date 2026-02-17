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
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const snsClient = new SNSClient({});

export async function triggerRecordingUpdate(id: string): Promise<void> {
  const topicArn = process.env.RADICASTER_SNS_TOPIC_ARN;
  if (!topicArn) {
    console.warn("RADICASTER_SNS_TOPIC_ARN is not set. Skipping SNS publish.");
    return;
  }

  // Construct a dummy S3 event payload that matches what gen-feed and cleanup-episodes expect
  // key format: {id}/data/{YYYYMMDD}.m4a or just {id}/something
  // gen-feed expects: id = key.split("/").first
  // cleanup-episodes expects: key.split("/").first and key format {id}/data/{YYYYMMDD}.m4a for date extraction
  // However, for cleanup, it lists episodes from S3, so the trigger event's key doesn't strictly need to be a valid episode 
  // IF the handler handles "non-date" keys gracefully or if we just need to trigger it.
  // 
  // cleanup-episodes handler:
  // extract_id(event) -> key.split("/").first
  // load_definition(id)
  // ...
  // So as long as ID is correct, it proceeds to list actual files from S3.
  //
  // gen-feed handler:
  // id = key.split("/").first
  // ...
  //
  // So a key like `${id}/trigger-update.m4a` should work for both to extract ID.
  // note: The SnsDestination in CDK adds a suffix filter for .m4a, but that's for S3->SNS.
  // Here we are publishing directly to SNS, so we can send whatever JSON we want, 
  // AS LONG AS the Lambda expects that JSON structure.
  // The Lambdas expect:
  // event["Records"][0]["Sns"]["Message"] -> JSON parse -> event["Records"][0]["s3"]["object"]["key"]

  const key = `${id}/trigger-update.m4a`;

  const s3Event = {
    Records: [
      {
        s3: {
          object: {
            key: key
          }
        }
      }
    ]
  };

  const message = JSON.stringify(s3Event);

  try {
    await snsClient.send(new PublishCommand({
      TopicArn: topicArn,
      Message: message,
    }));
    console.log(`Published SNS message for ${id} to update feed/cleanup.`);
  } catch (e) {
    console.error("Failed to publish SNS message:", e);
    // Don't fail the request just because SNS failed
  }
}


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
  retention_type?: "none" | "count" | "days";
  retention_value?: number;
  deleteImage?: boolean;
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


    // Check for image existence
    const bucketUrl = process.env.RADICASTER_BUCKET_URL;
    if (bucketUrl) {
      try {
        // Try jpg
        await s3Client.send(new GetObjectCommand({ Bucket: bucketName, Key: `radicaster/${id}.jpg` }));
        const baseUrl = bucketUrl.endsWith("/") ? bucketUrl.slice(0, -1) : bucketUrl;
        parsed.imageUrl = `${baseUrl}/radicaster/${id}.jpg`;
      } catch {
        try {
          // Try png
          await s3Client.send(new GetObjectCommand({ Bucket: bucketName, Key: `radicaster/${id}.png` }));
          const baseUrl = bucketUrl.endsWith("/") ? bucketUrl.slice(0, -1) : bucketUrl;
          parsed.imageUrl = `${baseUrl}/radicaster/${id}.png`;
        } catch {
          // No image found
        }
      }
    }

    return parsed;
  } catch (e: any) {
    if (e.name === 'NoSuchKey') return null;
    throw e;
  }
}

export async function deleteRecording(id: string, options: { keepImage?: boolean } = {}): Promise<string[]> {
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

    // Only delete images if keepImage is false (default)
    if (!options.keepImage) {
      try {
        await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: `radicaster/${id}.jpg` }));
      } catch { }
      try {
        await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: `radicaster/${id}.png` }));
      } catch { }
    }

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

  const yamlObj: Record<string, any> = {
    id: data.id,
    title: data.title,
    station: data.station,
    area: data.area,
    author: data.author,
    duration: data.duration,
    program_schedule: data.program_schedule,
    execution_schedule: executionSchedules.map((s) => s.toYamlString()),
  };

  if (data.retention_type && data.retention_type !== "none" && data.retention_value) {
    yamlObj.retention_type = data.retention_type;
    yamlObj.retention_value = data.retention_value;
  }

  const yamlContent = yaml.dump(yamlObj);

  // 2. Upload to S3
  // Delete existing images if requested
  if (data.deleteImage) {
    try {
      await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: `radicaster/${data.id}.jpg` }));
    } catch { }
    try {
      await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: `radicaster/${data.id}.png` }));
    } catch { }
  }

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
        CacheControl: "no-cache",
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
