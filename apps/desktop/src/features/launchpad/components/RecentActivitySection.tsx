import { useMemo } from "react";
import { ArrowRight, Clock, MessageSquare } from "lucide-react";
import type { AgentSession } from "@capyfin/contracts";
import { formatRelativeTime } from "../format-relative-time";

interface RecentActivitySectionProps {
  sessions: AgentSession[];
  onSessionSelect?: ((sessionId: string) => void) | undefined;
}

const MAX_ITEMS = 3;

/** Returns true when a string looks like a raw hex/UUID session key */
function isHexLike(value: string): boolean {
  return /^[0-9a-f]{6,}$/i.test(value.replace(/-/g, ""));
}

/** Produce a human-readable label — never expose raw hex session keys */
function sanitizeSessionLabel(session: AgentSession): string {
  const raw: string = session.label ?? session.sessionKey;
  if (isHexLike(raw.split(" ")[0] ?? "")) {
    return "Chat session";
  }
  return raw;
}

export function RecentActivitySection({
  sessions,
  onSessionSelect,
}: RecentActivitySectionProps) {
  const recentSessions = useMemo(() => {
    const sorted = [...sessions]
      .filter((s) => {
        const raw = s.label ?? s.sessionKey;
        return !isHexLike(raw.split(" ")[0] ?? "");
      })
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    return sorted.slice(0, MAX_ITEMS);
  }, [sessions]);

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
          Recent Activity
        </h2>
        <div className="h-px flex-1 bg-border/50" />
      </div>

      {recentSessions.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-border/50 bg-muted/[0.02] px-5 py-6 dark:bg-muted/[0.04]">
          <Clock className="size-4 text-muted-foreground/40" />
          <p className="text-[13px] text-muted-foreground/60">
            No recent activity yet — try running a workflow above.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {recentSessions.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => onSessionSelect?.(session.id)}
              className="group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-left transition-all hover:border-border/40 hover:bg-muted/40"
            >
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/[0.06] text-primary/60 transition-colors group-hover:bg-primary/[0.10] group-hover:text-primary/80 dark:bg-primary/[0.08]">
                <MessageSquare className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-foreground">
                  {sanitizeSessionLabel(session)}
                </p>
              </div>
              <span className="shrink-0 text-[11px] text-muted-foreground/50 transition-colors group-hover:text-muted-foreground">
                {formatRelativeTime(session.updatedAt)}
              </span>
            </button>
          ))}

          {sessions.length > MAX_ITEMS && (
            <a
              href="#chat"
              className="mt-1 flex items-center gap-1.5 px-3 text-[12px] font-medium text-muted-foreground/60 transition-colors hover:text-primary"
            >
              View all
              <ArrowRight className="size-3" />
            </a>
          )}
        </div>
      )}
    </section>
  );
}
