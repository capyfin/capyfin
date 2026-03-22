/**
 * Format a session timestamp for display in the sidebar.
 *
 * - Today: time only (e.g., "8:15 AM")
 * - Yesterday: "Yesterday HH:MM AM/PM" (e.g., "Yesterday 3:15 PM")
 * - This week (but not yesterday/today): day name (e.g., "Wednesday")
 * - Older: short date (e.g., "Mar 10")
 */
export function formatSessionTimestamp(
  isoTimestamp: string,
  now: Date = new Date(),
): string {
  const ts = new Date(isoTimestamp);

  const todayStart = startOfDay(now);
  if (ts >= todayStart) {
    return ts.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  if (ts >= yesterdayStart) {
    const time = ts.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `Yesterday ${time}`;
  }

  // Start of this week (Monday)
  const weekStart = startOfDay(now);
  const dayOfWeek = weekStart.getDay(); // 0 = Sunday
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  weekStart.setDate(weekStart.getDate() - daysSinceMonday);

  if (ts >= weekStart) {
    return ts.toLocaleDateString("en-US", { weekday: "long" });
  }

  // Older: short month + day
  return ts.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
