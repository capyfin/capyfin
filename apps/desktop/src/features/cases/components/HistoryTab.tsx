import type { CaseHistoryEntry } from "@capyfin/contracts";
import { Badge } from "@/components/ui/badge";
import { ConfidenceBadge } from "@/components/report/ConfidenceBadge";
import { StanceBadge } from "./StanceBadge";

const eventTypeLabels: Record<string, string> = {
  created: "Created",
  refreshed: "Refreshed",
  "earnings-update": "Earnings Update",
  "manual-edit": "Manual Edit",
  comparison: "Comparison",
};

interface HistoryTabProps {
  history: CaseHistoryEntry[];
}

export function HistoryTab({ history }: HistoryTabProps) {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="relative mb-3">
          <div className="absolute -inset-3 rounded-full bg-muted/50 blur-lg" />
          <div className="relative flex size-10 items-center justify-center rounded-full bg-muted/80">
            <span className="text-sm text-muted-foreground/50">0</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">No history entries yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/60 bg-card px-5 py-4">
      <div className="flex flex-col gap-0">
        {history.map((entry, index) => {
          const date = new Date(entry.date);
          const formattedDate = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });

          const eventColor =
            entry.eventType === "created"
              ? "bg-emerald-500"
              : entry.eventType === "refreshed"
                ? "bg-blue-500"
                : "bg-foreground/25";

          return (
            <div key={entry.id} className="relative flex gap-4 pb-7 last:pb-0">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div
                  className={`size-2.5 shrink-0 rounded-full ${eventColor} ring-4 ring-card`}
                />
                {index < history.length - 1 ? (
                  <div className="mt-1 w-px flex-1 bg-border/60" />
                ) : null}
              </div>

              <div className="flex flex-1 flex-col gap-1.5 -mt-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium tabular-nums text-muted-foreground/70">
                    {formattedDate}
                  </span>
                  <Badge
                    variant="secondary"
                    className="rounded-md text-[10px] font-medium px-1.5 py-0"
                  >
                    {eventTypeLabels[entry.eventType] ?? entry.eventType}
                  </Badge>
                </div>

                <p className="text-[13px] leading-relaxed text-foreground">
                  {entry.summary}
                </p>

                {(entry.priorStance &&
                  entry.newStance &&
                  entry.priorStance !== entry.newStance) ||
                (entry.priorConfidence &&
                  entry.newConfidence &&
                  entry.priorConfidence !== entry.newConfidence) ? (
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {entry.priorStance &&
                    entry.newStance &&
                    entry.priorStance !== entry.newStance ? (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <StanceBadge stance={entry.priorStance} />
                        <span className="text-muted-foreground/40">&rarr;</span>
                        <StanceBadge stance={entry.newStance} />
                      </div>
                    ) : null}
                    {entry.priorConfidence &&
                    entry.newConfidence &&
                    entry.priorConfidence !== entry.newConfidence ? (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ConfidenceBadge confidence={entry.priorConfidence} />
                        <span className="text-muted-foreground/40">&rarr;</span>
                        <ConfidenceBadge confidence={entry.newConfidence} />
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
