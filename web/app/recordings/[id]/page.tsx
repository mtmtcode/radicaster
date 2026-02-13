"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { RecordingForm, FormValues } from "@/app/components/RecordingForm";
import { cn } from "@/lib/utils";

interface ScheduleYaml {
  startDay: string;
  startHour: string;
  startMinute: string;
  durationMinutes: number;
  offsetMinutes: number;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function parseDayTime(str: string) {
  // str format: "Mon 21:00" or "Mon 21:00:00"
  const parts = str.match(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s*(\d{1,2}):(\d{1,2})/i);
  if (!parts) return null;
  return {
    day: parts[1],
    hour: parseInt(parts[2], 10),
    minute: parseInt(parts[3], 10),
  };
}

function calculateOffset(programTime: any, executionTime: any): number {
  if (!programTime || !executionTime) return 5;

  const progDayIdx = DAYS.indexOf(programTime.day);
  const execDayIdx = DAYS.indexOf(executionTime.day);

  let dayDiff = execDayIdx - progDayIdx;
  if (dayDiff < 0) dayDiff += 7;

  const progTotal = programTime.hour * 60 + programTime.minute;
  const execTotal = executionTime.hour * 60 + executionTime.minute + (dayDiff * 24 * 60);

  // execution = program + duration + offset
  // But wait, execution time in YAML usually marks the START of recording?
  // Let's check Rec-Radiko.
  // Actually, in `RecordingForm`, `executionTime` calculation is:
  // totalMinutesVal = totalCurrentMinutes + (duration || 0) + (offset || 0);
  // So Execution Time is the time when recording ENDS? Or STARTS?
  // Rec-Radiko usually takes "start time" and "duration".
  // If `execution_schedule` is passed to EventBridge cron, and the target is `rec-radiko`,
  // then `rec-radiko` is triggered at `execution_schedule`.
  // If `rec-radiko` starts recording immediately, then `execution_schedule` is the recording START time.

  // In `new/page.tsx`:
  // calculateExecutionTime adds duration!
  // `totalMinutesVal = totalCurrentMinutes + (duration || 0) + (offset || 0)`
  // This implies `execution_schedule` = BroadCastStart + Duration + Offset.
  // This means the recording starts AFTER the program ends?
  // Yes, usually for time-free recording, you record after it's done.
  // Radiko Time Free becomes available after broadcast.
  // So Offset is "how many minutes after broadcast ENDs do we start recording".

  // So: ExecutionTime = ProgramStart + Duration + Offset.
  // Thus: Offset = ExecutionTime - (ProgramStart + Duration).

  // However, I don't have Duration passed into this function yet.
  return execTotal - progTotal; // This returns (Duration + Offset)
}

export default function EditRecordingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<FormValues | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/recordings/${id}`);
        if (!res.ok) throw new Error("Failed to load recording");
        const yamlData = await res.json();

        // Map YAML to FormValues
        const programSchedules = yamlData.program_schedule || [];
        const executionSchedules = yamlData.execution_schedule || [];
        const duration = yamlData.duration || 60;

        const schedules = programSchedules.map((progStr: string, index: number) => {
          const prog = parseDayTime(progStr);
          const execStr = executionSchedules[index];
          const exec = execStr ? parseDayTime(execStr) : null;

          let offset = 5;
          if (prog && exec) {
            const diff = calculateOffset(prog, exec);
            // diff = Duration + Offset
            offset = diff - duration;
          }

          return {
            startDay: prog?.day || "Mon",
            startHour: prog?.hour.toString().padStart(2, "0") || "00",
            startMinute: prog?.minute.toString().padStart(2, "0") || "00",
            durationMinutes: duration,
            offsetMinutes: offset > 0 ? offset : 0,
          };
        });

        if (schedules.length === 0) {
          schedules.push({ startDay: "Mon", startHour: "21", startMinute: "00", durationMinutes: 60, offsetMinutes: 5 });
        }

        setData({
          id: yamlData.id,
          title: yamlData.title,
          author: yamlData.author || "",
          area: yamlData.area || "",
          station: yamlData.station || "",
          schedules: schedules,
          // imageFile is skipped, user has to re-upload if they want
        });

      } catch (e: any) {
        setError(e.message);
      }
    }
    fetchData();
  }, [id]);

  const onSubmit = async (formData: FormValues) => {
    setIsSubmitting(true);
    setResult(null);

    // Transform form data to API payload (same as new)
    const { imageFile, ...rest } = formData;

    // Recalculate execution times
    const payload = {
      ...rest,
      id: id, // Ensure ID is from params, though form field is disabled
      program_schedule: formData.schedules.map(s => `${s.startDay} ${s.startHour}:${s.startMinute}`),
      duration: formData.schedules[0]?.durationMinutes,
      execution_schedule: formData.schedules.map(s => {
        // calculateExecutionTime is internal to component or need export
        // I need to copy or import calculateExecutionTime logic.
        // Since I haven't exported it from RecordingForm (it was inside the file but outside component),
        // I will reimplement logic or assume form calculates it?
        // No, form data has inputs. Backend expects `execution_schedule`.
        // I reused logic in `new/page.tsx` for submission. 
        // I should do same here.

        const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const dayIndex = DAYS.indexOf(s.startDay);
        const totalCurrentMinutes = parseInt(s.startHour || "0") * 60 + parseInt(s.startMinute || "0");
        const totalMinutesVal = totalCurrentMinutes + (s.durationMinutes || 0) + (s.offsetMinutes || 0);
        let totalMinutes = totalMinutesVal;
        let newDayIndex = dayIndex;
        while (totalMinutes >= 24 * 60) {
          totalMinutes -= 24 * 60;
          newDayIndex = (newDayIndex + 1) % 7;
        }
        const newHour = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
        const newMinute = (totalMinutes % 60).toString().padStart(2, "0");
        const newDay = DAYS[newDayIndex];
        return `${newDay} ${newHour}:${newMinute}`;
      }),
    };

    const apiFormData = new FormData();
    apiFormData.append("data", JSON.stringify(payload));
    if (imageFile && imageFile.length > 0) {
      apiFormData.append("image", imageFile[0]);
    }

    try {
      const response = await fetch(`/api/recordings/${id}`, {
        method: "PUT",
        body: apiFormData,
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || "Failed to update");
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

  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;
  if (!data) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 text-black">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Edit Recording</h1>
          <p className="mt-2 text-sm text-gray-600">
            Edit recording schedule. Changing details will delete and recreate the resources.
          </p>
        </div>

        {result && (
          <div className={cn("p-4 mb-6 rounded-md", result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800")}>
            {result.message}
          </div>
        )}

        <RecordingForm initialValues={data} isEditing={true} onSubmit={onSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}
