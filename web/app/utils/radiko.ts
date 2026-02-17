
import { RADIKO_STATIONS } from "@/app/constants/radiko";

export interface RadikoShareInfo {
  title: string;
  stationId: string;
  stationName: string;
  areaId?: string;
  startDay: string;
  startHour: string;
  startMinute: string;
  durationMinutes: number;
  description?: string;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// Radiko's share string uses Japanese day names
const DAY_MAP: Record<string, string> = {
  "月": "Mon", "火": "Tue", "水": "Wed", "木": "Thu", "金": "Fri", "土": "Sat", "日": "Sun",
  "Mon": "Mon", "Tue": "Tue", "Wed": "Wed", "Thu": "Thu", "Fri": "Fri", "Sat": "Sat", "Sun": "Sun"
};

export function parseRadikoShareString(input: string): RadikoShareInfo | null {
  try {
    // Expected format:
    // Title | Station Name | YYYY/MM/DD/Day HH:mm-HH:mm URL

    const lines = input.trim().split("\n");
    const urlLine = lines.find(line => line.includes("radiko.jp/share"));

    if (!urlLine && !input.includes("radiko.jp/share")) {
      return null;
    }

    const urlMatch = input.match(/https?:\/\/radiko\.jp\/share\/\?([^\s]+)/);
    let stationId = "";
    let startTimeStr = "";

    if (urlMatch) {
      const params = new URLSearchParams(urlMatch[1]);
      stationId = params.get("sid") || "";
      startTimeStr = params.get("t") || "";
    }

    const parts = input.split("|").map(p => p.trim());

    let title = "";
    let stationName = "";

    if (parts.length >= 3) {
      title = parts[0];
      stationName = parts[1];
    } else {
      title = parts[0];
    }

    let startDayKey = "Mon"; // default
    let startHour = "00";
    let startMinute = "00";
    let duration = 0;

    // Try to parse full date first
    // Format: YYYY/MM/DD/Day HH:mm-HH:mm
    // Regex explanation:
    // (\d{4})/(\d{1,2})/(\d{1,2})/[^\s]+ -> Date part
    // \s* -> flexible spaces
    // (\d{1,2}):(\d{2}) -> Start Time
    // \s*-\s* -> Separator
    // (\d{1,2}):(\d{2}) -> End Time
    const dateMatch = input.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})\/[^\s]+\s*(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);

    // Also try to find just time range if full date is not matched or formatted differently
    // Look for HH:MM-HH:MM pattern anywhere
    const timeRangeMatch = input.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);

    if (dateMatch) {
      const [_, year, month, day, sHour, sMin, eHour, eMin] = dateMatch;

      const startH = parseInt(sHour, 10);
      const startM = parseInt(sMin, 10);
      const endH = parseInt(eHour, 10);
      const endM = parseInt(eMin, 10);

      const startTotal = startH * 60 + startM;
      const endTotal = endH * 60 + endM;

      duration = endTotal - startTotal;
      if (duration < 0) duration += 24 * 60;

      const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      d.setHours(startH, startM);

      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      startDayKey = days[d.getDay()];
      startHour = d.getHours().toString().padStart(2, "0");
      startMinute = d.getMinutes().toString().padStart(2, "0");

    } else if (startTimeStr) {
      // Use t param for start time
      const year = parseInt(startTimeStr.substring(0, 4));
      const month = parseInt(startTimeStr.substring(4, 6)) - 1;
      const day = parseInt(startTimeStr.substring(6, 8));
      const hour = parseInt(startTimeStr.substring(8, 10));
      const minute = parseInt(startTimeStr.substring(10, 12));

      const d = new Date(year, month, day, hour, minute);

      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      startDayKey = days[d.getDay()];
      startHour = hour.toString().padStart(2, "0");
      startMinute = minute.toString().padStart(2, "0");

      // Try to get duration from timeRangeMatch if exists
      if (timeRangeMatch) {
        const [_, sHour, sMin, eHour, eMin] = timeRangeMatch;
        const startH = parseInt(sHour, 10);
        const startM = parseInt(sMin, 10);
        const endH = parseInt(eHour, 10);
        const endM = parseInt(eMin, 10);
        const startTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;
        duration = endTotal - startTotal;
        if (duration < 0) duration += 24 * 60;
      }
    }

    // Lookup Area ID
    const station = RADIKO_STATIONS.find(s => s.id === stationId || s.name === stationName);
    const areaId = station?.areaId;
    if (!stationName && station) {
      stationName = station.name;
    }

    return {
      title,
      stationId,
      stationName,
      areaId,
      startDay: startDayKey,
      startHour,
      startMinute,
      durationMinutes: duration || 120,
      description: input
    };
  } catch (e) {
    console.error("Failed to parse Radiko share string", e);
    return null;
  }
}
