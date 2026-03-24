import { useMemo } from "react";
import { Clock, MessageSquare } from "lucide-react";
import type { AgentSession } from "@capyfin/contracts";
import { formatRelativeTime } from "../format-relative-time";

interface RecentActivitySectionProps {
  sessions: AgentSession[];
  onSessionSelect?: ((sessionId: string) => void) | undefined;
}

const MAX_ITEMS = 5;

export function RecentActivitySection({
  sessions,
  onSessionSelect,
}: RecentActivitySectionProps) {
  const recentSessions = useMemo(() => {
    const sorted = [...sessions].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    return sorted.slice(0, MAX_ITEMS);
  }, [sessions]);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
          Recent Activity
        </h2>
        <div className="h-px flex-1 bg-border/50" />
      </div>

      {recentSessions.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-border/60 px-5 py-6">
          <Clock className="size-4 text-muted-foreground/50" />
          <p className="text-[13px] text-muted-foreground/70">
            No recent activity yet — try running a card above.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {recentSessions.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => onSessionSelect?.(session.id)}
              className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/[0.06] text-primary/70 dark:bg-primary/[0.08]">
                <MessageSquare className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-foreground">
                  {session.label ?? session.sessionKey}
                </p>
              </div>
              <span className="shrink-0 text-[11px] text-muted-foreground/60">
                {formatRelativeTime(session.updatedAt)}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
