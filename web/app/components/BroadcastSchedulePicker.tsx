
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0")); // 5-minute intervals

interface BroadcastSchedulePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function BroadcastSchedulePicker({ value, onChange, className }: BroadcastSchedulePickerProps) {
  // Parse initial value or default to Mon 21:00
  const parseValue = (val: string) => {
    // Try matching "Day HH:MM"
    const match = val.match(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s*([0-5]?[0-9]):([0-5]?[0-9])/i);
    if (match) {
      return {
        day: match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase(),
        startHour: match[2].padStart(2, "0"),
        startMinute: match[3].padStart(2, "0"),
      };
    }
    return { day: "Mon", startHour: "21", startMinute: "00" };
  };

  const { day, startHour, startMinute } = parseValue(value);

  const handleChange = (key: "day" | "startHour" | "startMinute", newValue: string) => {
    const current = parseValue(value);
    const next = { ...current, [key]: newValue };
    // Format: "Day HH:MM"
    onChange(`${next.day} ${next.startHour}:${next.startMinute}`);
  };

  return (
    <div className={cn("flex flex-wrap gap-2 items-center", className)}>
      <select
        value={day}
        onChange={(e) => handleChange("day", e.target.value)}
        className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
        aria-label="Day of week"
      >
        {DAYS.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-1">
        <select
          value={startHour}
          onChange={(e) => handleChange("startHour", e.target.value)}
          className="block w-16 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
          aria-label="Start Hour"
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="text-gray-500">:</span>
        <select
          value={startMinute}
          onChange={(e) => handleChange("startMinute", e.target.value)}
          className="block w-16 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
          aria-label="Start Minute"
        >
          {MINUTES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
          {!MINUTES.includes(startMinute) && <option value={startMinute}>{startMinute}</option>}
        </select>
      </div>
    </div>
  );
}
