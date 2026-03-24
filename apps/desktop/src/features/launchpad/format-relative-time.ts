/**
 * Format a date string as a human-readable relative time (e.g. "2 hours ago", "yesterday").
 */
export function formatRelativeTime(
  dateStr: string,
  now: Date = new Date(),
): string {
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${String(diffMin)}m ago`;
  if (diffHour < 24) return `${String(diffHour)}h ago`;
  if (diffDay === 1) return "yesterday";
  if (diffDay < 7) return `${String(diffDay)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
