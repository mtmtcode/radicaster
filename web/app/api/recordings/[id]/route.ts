import { NextRequest, NextResponse } from "next/server";
import {
  S3Client,
  DeleteObjectCommand
} from "@aws-sdk/client-s3";
import {
  EventBridgeClient,
  ListRulesCommand,
  RemoveTargetsCommand,
  DeleteRuleCommand
} from "@aws-sdk/client-eventbridge";

const s3Client = new S3Client({});
const eventBridgeClient = new EventBridgeClient({});

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Program ID is required" }, { status: 400 });
  }

  const bucketName = process.env.RADICASTER_S3_BUCKET;
  if (!bucketName) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const errors: string[] = [];

  // 1. Delete S3 Object
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: `radicaster/${id}.yaml`,
      })
    );
  } catch (error: any) {
    console.error(`Failed to delete S3 object for ${id}:`, error);
    // Continue cleanup even if S3 fails (might be already gone)
  }

  // 2. Delete EventBridge Rules
  try {
    const rulesToDelete: string[] = [];
    let nextToken: string | undefined;

    // List rules with prefix
    // Note: ListRules NamePrefix is helpful but we must filter strictly for `${id}_Index` pattern
    do {
      const cmd: ListRulesCommand = new ListRulesCommand({
        NamePrefix: `${id}_`,
        Limit: 50,
        NextToken: nextToken,
      });
      const response = await eventBridgeClient.send(cmd);

      if (response.Rules) {
        for (const rule of response.Rules) {
          if (rule.Name && /^.+_\d+$/.test(rule.Name) && rule.Name.startsWith(`${id}_`)) {
            rulesToDelete.push(rule.Name);
          }
        }
      }
      nextToken = response.NextToken;
    } while (nextToken);

    // Delete each rule
    for (const ruleName of rulesToDelete) {
      try {
        // Remove targets first (required before deleting rule)
        await eventBridgeClient.send(
          new RemoveTargetsCommand({
            Rule: ruleName,
            Ids: ["rec-radiko"], // Assuming fixed target ID from creation logic
          })
        );
      } catch (e) {
        // Ignore checking if target exists, just proceed to delete rule
        // or log it. If remove targets fails, delete rule will likely fail.
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

  if (errors.length > 0) {
    return NextResponse.json({
      success: false,
      message: "Completed with errors",
      errors
    }, { status: 200 }); // Return 200 but check errors, or 500?
    // Let's use 200 with error details so UI can show warning if needed,
    // but principally the "delete" action is "done" (we tried our best).
  }

  return NextResponse.json({ success: true, id });
}
