import { History } from "lucide-react";
import type { RecentUpdate } from "../home-utils";

interface RecentCaseUpdatesProps {
  updates: RecentUpdate[];
}

function relativeDate(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${String(diffDays)} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${String(weeks)} ${weeks === 1 ? "week" : "weeks"} ago`;
  }
  const months = Math.floor(diffDays / 30);
  return `${String(months)} ${months === 1 ? "month" : "months"} ago`;
}

const EVENT_LABELS: Record<string, string> = {
  created: "Created",
  refreshed: "Refreshed",
  "earnings-update": "Earnings",
  "manual-edit": "Edited",
  comparison: "Compared",
  "drift-detected": "Drift",
};

export function RecentCaseUpdates({ updates }: RecentCaseUpdatesProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex size-6 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-blue-500/15">
          <History className="size-3.5 text-blue-500/60" />
        </div>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/40">
          Recent Updates
        </h2>
        <div className="h-px flex-1 bg-border/30" />
      </div>
      {updates.length === 0 ? (
        <p className="py-2 text-[13px] text-muted-foreground/50">
          No recent case activity
        </p>
      ) : (
        <div className="space-y-1">
          {updates.map((update, i) => (
            <div
              key={`${update.caseId}-${update.date}-${String(i)}`}
              className="flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/40"
            >
              <History className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/40" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-foreground/[0.05] px-1.5 py-0.5 font-mono text-[11px] font-bold tracking-wide dark:bg-foreground/[0.07]">
                    {update.ticker}
                  </span>
                  <span className="truncate text-[12px] text-foreground/80">
                    {update.summary}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground/50">
                  <span>
                    {EVENT_LABELS[update.eventType] ?? update.eventType}
                  </span>
                  <span>&middot;</span>
                  <span>{relativeDate(update.date)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
