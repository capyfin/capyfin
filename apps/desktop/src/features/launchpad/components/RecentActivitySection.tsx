import { useMemo } from "react";
import {
  ArrowRight,
  Clock,
  MessageSquare,
  Newspaper,
  Search,
  type LucideIcon,
} from "lucide-react";
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

/* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
function getSessionStyle(label: string): {
  icon: LucideIcon;
  bg: string;
  color: string;
} {
  const lower = label.toLowerCase();
  if (lower.includes("morning brief")) {
    return {
      icon: Newspaper,
      bg: "bg-amber-500/[0.06] group-hover:bg-amber-500/[0.10]",
      color: "text-amber-500/60 group-hover:text-amber-500/80",
    };
  }
  if (lower.includes("deep dive")) {
    return {
      icon: Search,
      bg: "bg-blue-500/[0.06] group-hover:bg-blue-500/[0.10]",
      color: "text-blue-500/60 group-hover:text-blue-500/80",
    };
  }
  return {
    icon: MessageSquare,
    bg: "bg-primary/[0.06] group-hover:bg-primary/[0.10]",
    color: "text-primary/60 group-hover:text-primary/80",
  };
}
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

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
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
          Recent Activity
        </h2>
        <div className="h-px flex-1 bg-border/40" />
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
          {recentSessions.map((session) => {
            const label = sanitizeSessionLabel(session);
            const style = getSessionStyle(label);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lucide-react icon types
            const SessionIcon = style.icon;
            return (
              <button
                key={session.id}
                type="button"
                onClick={() => onSessionSelect?.(session.id)}
                className="group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-left transition-all hover:border-border/40 hover:bg-muted/40"
              >
                <div
                  className={`flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors ${style.bg}`}
                >
                  <SessionIcon className={`size-3.5 ${style.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-foreground">
                    {label}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground/50 transition-colors group-hover:text-muted-foreground">
                  {formatRelativeTime(session.updatedAt)}
                </span>
              </button>
            );
          })}

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
