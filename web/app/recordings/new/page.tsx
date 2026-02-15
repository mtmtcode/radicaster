"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { RecordingForm, FormValues } from "@/app/components/RecordingForm";

function calculateExecutionTime(day: string, hour: string, minute: string, duration: number, offset: number) {
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dayIndex = DAYS.indexOf(day);
  if (dayIndex === -1) return "Invalid Day";

  const totalCurrentMinutes = parseInt(hour || "0") * 60 + parseInt(minute || "0");
  const totalMinutesVal = totalCurrentMinutes + (duration || 0) + (offset || 0);
  let totalMinutes = totalMinutesVal;
  let newDayIndex = dayIndex;

  // Handle day rollover
  while (totalMinutes >= 24 * 60) {
    totalMinutes -= 24 * 60;
    newDayIndex = (newDayIndex + 1) % 7;
  }

  const newHour = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
  const newMinute = (totalMinutes % 60).toString().padStart(2, "0");
  const newDay = DAYS[newDayIndex];

  return `${newDay} ${newHour}:${newMinute}`;
}

export default function NewRecordingPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setResult(null);

    // Transform form data to API payload
    const { imageFile, ...rest } = data;

    const payload: Record<string, any> = {
      ...rest,
      program_schedule: data.schedules.map(s => `${s.startDay} ${s.startHour}:${s.startMinute}`),
      duration: data.schedules[0]?.durationMinutes,
      execution_schedule: data.schedules.map(s => calculateExecutionTime(s.startDay, s.startHour, s.startMinute, s.durationMinutes, s.offsetMinutes)),
    };
    if (data.retentionType && data.retentionType !== "none") {
      payload.retention_type = data.retentionType;
      payload.retention_value = data.retentionValue;
    }

    const formData = new FormData();
    formData.append("data", JSON.stringify(payload));
    if (imageFile && imageFile.length > 0) {
      formData.append("image", imageFile[0]);
    }

    try {
      const response = await fetch("/api/recordings", {
        method: "POST",
        body: formData,
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || "Failed to submit");
      }

      router.push("/");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setResult({ success: false, message: error.message });
      } else {
        setResult({ success: false, message: "An unexpected error occurred" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 text-black">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Radicaster Recording Scheduler</h1>
          <p className="mt-2 text-sm text-gray-600">
            Create a new recording schedule definition. This will generate a YAML file, upload it to S3, and register EventBridge rules.
          </p>
        </div>

        {result && (
          <div className={cn("p-4 mb-6 rounded-md", result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800")}>
            {result.message}
          </div>
        )}

        <RecordingForm onSubmit={onSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}
