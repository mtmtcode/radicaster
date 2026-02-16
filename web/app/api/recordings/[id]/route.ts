import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRecording, deleteRecording, createRecording } from "@/lib/radicaster/actions";

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  try {
    const data = await getRecording(id);
    if (!data) {
      return NextResponse.json({ error: "Recording not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`Error fetching recording ${id}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  try {
    const formData = await request.formData();
    const dataJson = formData.get("data") as string;
    const imageFile = formData.get("image") as File | null;

    if (!dataJson) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const body = JSON.parse(dataJson);
    const data = requestSchema.parse(body);

    if (data.id !== id) {
      return NextResponse.json({ error: "ID mismatch" }, { status: 400 });
    }

    // Determine if we should keep the existing image
    // If a new image is provided (imageFile), we don't keep the old one (it gets overwritten or deleted)
    // If no new image is provided:
    //   - If deleteImage is true, we delete the old one
    //   - If deleteImage is false/undefined, we keep the old one

    // Note: requestSchema doesn't have deleteImage, so we check body directly or update schema
    // Let's check body directly for now as Zod strips unknown keys by default if strict() is used,
    // but here it's simple object().
    const shouldDeleteImage = body.deleteImage === true;
    const hasNewImage = imageFile && imageFile.size > 0;

    const keepImage = !hasNewImage && !shouldDeleteImage;

    // Delete existing
    // We pass keepImage option
    const deleteErrors = await deleteRecording(id, { keepImage });
    if (deleteErrors.length > 0) {
      console.warn(`Delete errors for ${id} during update:`, deleteErrors);
      // Continue anyway as we want to recreate
    }

    // Create new
    await createRecording({
      ...data,
      imageFile: imageFile || undefined
    });

    return NextResponse.json({ success: true, id });

  } catch (error: any) {
    console.error(`Error updating recording ${id}:`, error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: (error as any).issues }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Program ID is required" }, { status: 400 });
  }

  const errors = await deleteRecording(id);

  if (errors.length > 0) {
    return NextResponse.json({
      success: false,
      message: "Completed with errors",
      errors
    }, { status: 200 });
  }

  return NextResponse.json({ success: true, id });
}
