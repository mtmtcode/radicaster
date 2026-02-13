
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0")); // 5-minute intervals

interface ExecutionSchedulePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ExecutionSchedulePicker({ value, onChange, className }: ExecutionSchedulePickerProps) {
  // Parse initial value or default to Mon 00:00
  const parseValue = (val: string) => {
    const match = val.match(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s*([0-5]?[0-9]):([0-5]?[0-9])/i);
    if (match) {
      return {
        day: match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase(),
        hour: match[2].padStart(2, "0"),
        minute: match[3].padStart(2, "0"),
      };
    }
    return { day: "Mon", hour: "21", minute: "00" };
  };

  const { day, hour, minute } = parseValue(value);

  const handleChange = (key: "day" | "hour" | "minute", newValue: string) => {
    const current = parseValue(value);
    const next = { ...current, [key]: newValue };
    onChange(`${next.day} ${next.hour}:${next.minute}`);
  };

  return (
    <div className={cn("flex gap-2", className)}>
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

      <span className="self-center text-gray-500">:</span>

      <select
        value={hour}
        onChange={(e) => handleChange("hour", e.target.value)}
        className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
        aria-label="Hour"
      >
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>

      <span className="self-center text-gray-500">:</span>

      <select
        value={minute}
        onChange={(e) => handleChange("minute", e.target.value)}
        className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
        aria-label="Minute"
      >
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
        {/* Allow custom minute if not in 5-min intervals (e.g. from existing data) */}
        {!MINUTES.includes(minute) && (
          <option value={minute}>{minute}</option>
        )}
      </select>
    </div>
  );
}
