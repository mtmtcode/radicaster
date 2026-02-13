
import { NextRequest, NextResponse } from "next/server";
import { LambdaClient, InvokeCommand, InvokeCommandInput } from "@aws-sdk/client-lambda";

const lambdaClient = new LambdaClient({
  region: process.env.AWS_REGION || "ap-northeast-1",
  // Credentials are automatically loaded from environment variables or shared credentials file
  // when running locally.
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Use Promise for dynamic route params in Next.js 15+
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Program ID is required" }, { status: 400 });
  }

  let functionName = process.env.RADICASTER_REC_RADIKO_FUNCTION_NAME;
  const arn = process.env.RADICASTER_REC_RADIKO_ARN;

  if (!functionName && arn) {
    const parts = arn.split(":");
    functionName = parts[parts.length - 1];
  }

  if (!functionName) {
    console.error("RADICASTER_REC_RADIKO_ARN or RADICASTER_REC_RADIKO_FUNCTION_NAME is not set");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  try {
    const payload = JSON.stringify({ id });
    const command = new InvokeCommand({
      FunctionName: functionName,
      InvocationType: "Event", // Asynchronous invocation
      Payload: new TextEncoder().encode(payload),
    });

    await lambdaClient.send(command);

    return NextResponse.json({ success: true, message: `Recording triggered for ${id}` });
  } catch (error) {
    console.error("Error invoking Lambda:", error);
    return NextResponse.json(
      { error: "Failed to trigger recording" },
      { status: 500 }
    );
  }
}
