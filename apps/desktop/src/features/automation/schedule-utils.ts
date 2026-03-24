import type { AutomationSchedule } from "@capyfin/contracts";

const DAY_LABELS: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

type DayName = AutomationSchedule["days"][number];

const WEEKDAYS: DayName[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
];
const ALL_DAYS: DayName[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function formatTime12h(time24: string): string {
  const [hStr = "0", mStr = "00"] = time24.split(":");
  const h = parseInt(hStr, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${String(h12)}:${mStr} ${suffix}`;
}

function formatTimezone(tz: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "short",
    });
    const parts = formatter.formatToParts(new Date());
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    return tzPart?.value ?? tz;
  } catch {
    return tz;
  }
}

export function formatScheduleSummary(schedule: AutomationSchedule): string {
  const time = formatTime12h(schedule.time);
  const tz = formatTimezone(schedule.timezone);
  const sortedDays = [...schedule.days].sort(
    (a, b) => ALL_DAYS.indexOf(a) - ALL_DAYS.indexOf(b),
  );

  if (sortedDays.length === 7) {
    return `Daily at ${time} ${tz}`;
  }
  if (
    sortedDays.length === 5 &&
    WEEKDAYS.every((d) => sortedDays.includes(d))
  ) {
    return `Weekdays at ${time} ${tz}`;
  }
  const dayStr = sortedDays.map((d) => DAY_LABELS[d] ?? d).join(", ");
  return `${dayStr} at ${time} ${tz}`;
}

export const STEP_LABELS = [
  "Select Card",
  "Schedule",
  "Destination",
  "Filters",
];

export function formatDuration(ms: number | null): string {
  if (ms === null) return "\u2014";
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${String(totalSeconds)}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes)}m ${String(seconds)}s`;
}
