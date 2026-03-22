import type { AgentSession } from "@capyfin/contracts";

export interface SessionGroup {
  label: string;
  sessions: AgentSession[];
}

const GROUP_LABELS = [
  "Today",
  "Yesterday",
  "This week",
  "This month",
  "Older",
] as const;

/**
 * Categorize sessions into temporal groups based on `updatedAt`.
 *
 * Groups are returned in chronological order (Today first, Older last).
 * Empty groups are omitted. Session order within each group is preserved.
 */
export function groupSessionsByDate(
  sessions: AgentSession[],
  now: Date = new Date(),
): SessionGroup[] {
  if (sessions.length === 0) return [];

  const todayStart = startOfDay(now);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  // Start of this week (Monday)
  const weekStart = startOfDay(now);
  const dayOfWeek = weekStart.getDay(); // 0 = Sunday
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  weekStart.setDate(weekStart.getDate() - daysSinceMonday);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const buckets: [
    AgentSession[],
    AgentSession[],
    AgentSession[],
    AgentSession[],
    AgentSession[],
  ] = [[], [], [], [], []];

  for (const session of sessions) {
    const ts = new Date(session.updatedAt);
    if (ts >= todayStart) {
      buckets[0].push(session);
    } else if (ts >= yesterdayStart) {
      buckets[1].push(session);
    } else if (ts >= weekStart) {
      buckets[2].push(session);
    } else if (ts >= monthStart) {
      buckets[3].push(session);
    } else {
      buckets[4].push(session);
    }
  }

  const groups: SessionGroup[] = [];
  for (let i = 0; i < GROUP_LABELS.length; i++) {
    const bucket = buckets[i as 0 | 1 | 2 | 3 | 4];
    if (bucket.length > 0) {
      groups.push({
        label: GROUP_LABELS[i as 0 | 1 | 2 | 3 | 4],
        sessions: bucket,
      });
    }
  }
  return groups;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
