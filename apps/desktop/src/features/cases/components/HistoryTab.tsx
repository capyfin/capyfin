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
      <p className="py-8 text-center text-sm text-muted-foreground">
        No history entries yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      {history.map((entry, index) => {
        const date = new Date(entry.date);
        const formattedDate = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        return (
          <div key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              <div className="size-2.5 shrink-0 rounded-full bg-foreground/20 ring-4 ring-background" />
              {index < history.length - 1 ? (
                <div className="mt-1 w-px flex-1 bg-border" />
              ) : null}
            </div>

            <div className="flex flex-1 flex-col gap-1.5 -mt-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {formattedDate}
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  {eventTypeLabels[entry.eventType] ?? entry.eventType}
                </Badge>
              </div>

              <p className="text-sm text-foreground">{entry.summary}</p>

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
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <StanceBadge stance={entry.priorStance} />
                      <span>&rarr;</span>
                      <StanceBadge stance={entry.newStance} />
                    </div>
                  ) : null}
                  {entry.priorConfidence &&
                  entry.newConfidence &&
                  entry.priorConfidence !== entry.newConfidence ? (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ConfidenceBadge confidence={entry.priorConfidence} />
                      <span>&rarr;</span>
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
  );
}
