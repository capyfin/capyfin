import { Radio, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { WatchlistChange } from "../attention-utils";

interface WatchlistChangesProps {
  changes: WatchlistChange[];
}

const changeTypeLabels: Record<WatchlistChange["changeType"], string> = {
  "stance-changed": "Stance",
  "confidence-changed": "Confidence",
  "case-updated": "Updated",
};

const changeTypeColors: Record<WatchlistChange["changeType"], string> = {
  "stance-changed":
    "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20",
  "confidence-changed":
    "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
  "case-updated":
    "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

export function WatchlistChanges({ changes }: WatchlistChangesProps) {
  if (changes.length === 0) return null;

  const top5 = changes.slice(0, 5);

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
          Watchlist Changes
        </h2>
        <div className="h-px flex-1 bg-border/50" />
      </div>

      <div className="space-y-1.5">
        {top5.map((change) => (
          <button
            key={change.ticker}
            type="button"
            onClick={() => {
              window.location.hash = "#watchlist";
            }}
            className="group flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors hover:border-border/50 hover:bg-muted/30"
          >
            <Radio className="size-3.5 shrink-0 text-emerald-500 dark:text-emerald-400" />

            {/* Ticker */}
            <span className="text-[13px] font-semibold text-foreground">
              {change.ticker}
            </span>

            {/* Change type badge */}
            <Badge
              variant="outline"
              className={`text-[10px] ${changeTypeColors[change.changeType]}`}
            >
              {changeTypeLabels[change.changeType]}
            </Badge>

            {/* Summary */}
            <span className="min-w-0 flex-1 truncate text-[12px] text-muted-foreground">
              {change.summary}
            </span>

            {/* Days ago */}
            <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground/60">
              {change.daysAgo === 0
                ? "today"
                : `${String(change.daysAgo)}d ago`}
            </span>

            <ArrowRight className="size-3 shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        ))}
      </div>
    </section>
  );
}
