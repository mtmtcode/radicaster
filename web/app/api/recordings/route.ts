import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { EventBridgeClient, PutRuleCommand, PutTargetsCommand } from "@aws-sdk/client-eventbridge";
import * as yaml from "js-yaml";
import { z } from "zod";
import { ExecutionSchedule } from "@/lib/radicaster/schedule";

const s3Client = new S3Client({});
const eventBridgeClient = new EventBridgeClient({});

const scheduleSchema = z.string().regex(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s*([0-5]?[0-9]):([0-5]?[0-9])(?::([0-5]?[0-9]))?$/i);

const requestSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9_-]+$/),
  title: z.string().min(1),
  author: z.string().min(1),
  image: z.string().url().or(z.literal("")),
  area: z.string().min(1),
  station: z.string().min(1),
  program_schedule: z.array(z.string().min(1)),
  execution_schedule: z.array(scheduleSchema),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = requestSchema.parse(body);

    const bucketName = process.env.RADICASTER_S3_BUCKET;
    const recRadikoArn = process.env.RADICASTER_REC_RADIKO_ARN;

    if (!bucketName || !recRadikoArn) {
      return NextResponse.json(
        { error: "Server configuration error: Missing environment variables" },
        { status: 500 }
      );
    }

    // 1. Generate YAML
    const executionSchedules = data.execution_schedule.map((s) => ExecutionSchedule.parse(s));

    // Convert execution schedules to the format expected in YAML (e.g., "Mon 21:00:00")
    const yamlContent = yaml.dump({
      id: data.id,
      title: data.title,
      station: data.station,
      area: data.area,
      author: data.author,
      image: data.image,
      program_schedule: data.program_schedule,
      execution_schedule: executionSchedules.map((s) => s.toYamlString()),
    });

    // 2. Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: `${data.id}/radicaster.yaml`,
        Body: yamlContent,
        ContentType: "application/x-yaml",
      })
    );

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

    return NextResponse.json({ success: true, id: data.id });
  } catch (error: any) {
    console.error("Error processing request:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: (error as any).issues || (error as any).errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
