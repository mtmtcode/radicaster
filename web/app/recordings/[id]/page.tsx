"use client";

import { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RecordingForm, FormValues } from "@/app/components/RecordingForm";
import { EpisodeList } from "@/app/components/EpisodeList";
import { MoreHorizontal, Trash2, Mic, ChevronLeft } from "lucide-react";
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

  return execTotal - progTotal;
}

export default function EditRecordingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<FormValues | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [triggeringId, setTriggeringId] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTriggerRecording = async () => {
    if (confirm(`Record "${id}" immediately?`)) {
      setMenuOpen(false);
      setTriggeringId(true);
      try {
        const res = await fetch(`/api/recordings/${id}/trigger`, { method: "POST" });
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error || "Failed to trigger");
        }
        alert(`Recording triggered for ${id}!`);
      } catch (err: any) {
        alert(`Error: ${err.message}`);
      } finally {
        setTriggeringId(false);
      }
    }
  };

  const handleDeleteRecording = async () => {
    if (confirm(`Delete "${id}"? This will remove the schedule and definition.`)) {
      setMenuOpen(false);
      try {
        const res = await fetch(`/api/recordings/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error || json.message || "Failed to delete");
        }
        router.push("/");
      } catch (err: any) {
        alert(`Error: ${err.message}`);
      }
    }
  };

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
          retentionType: yamlData.retention_type || "none",
          retentionValue: yamlData.retention_value || undefined,
          imageUrl: yamlData.imageUrl,
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
    const payload: Record<string, any> = {
      ...rest,
      id: id, // Ensure ID is from params, though form field is disabled
      program_schedule: formData.schedules.map(s => `${s.startDay} ${s.startHour}:${s.startMinute}`),
      duration: formData.schedules[0]?.durationMinutes,
      execution_schedule: formData.schedules.map(s => {
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
    if (formData.retentionType && formData.retentionType !== "none") {
      payload.retention_type = formData.retentionType;
      payload.retention_value = formData.retentionValue;
    }

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
    <div className="max-w-3xl mx-auto py-4 text-black">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors focus:outline-none"
            aria-label="More actions"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
              <div className="py-1">
                <button
                  type="button"
                  onClick={handleTriggerRecording}
                  disabled={triggeringId}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                >
                  <Mic className="h-4 w-4" />
                  {triggeringId ? "Triggering..." : "今すぐ録音する"}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteRecording}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  削除
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100">
        {result && (
          <div className={cn("p-4 mb-6 rounded-md", result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800")}>
            {result.message}
          </div>
        )}

        <RecordingForm initialValues={data} isEditing={true} onSubmit={onSubmit} isSubmitting={isSubmitting} />

        <div className="mt-12 pt-8 border-t border-gray-100">
          <EpisodeList id={id} />
        </div>
      </div>
    </div>
  );
}
