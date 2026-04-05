import { Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StaleCase } from "../attention-utils";
import { actionCards } from "../card-registry";
import type { ActionCard } from "../types";

interface NeedsReviewProps {
  staleCases: StaleCase[];
  onCardClick?: ((card: ActionCard, input?: string) => void) | undefined;
}

const stanceColors: Record<string, string> = {
  bullish: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
  bearish: "text-red-600 dark:text-red-400 bg-red-500/10",
  neutral: "text-slate-600 dark:text-slate-400 bg-slate-500/10",
  watching: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
};

export function NeedsReview({ staleCases, onCardClick }: NeedsReviewProps) {
  const top5 = staleCases.slice(0, 5);

  if (top5.length === 0) {
    return null;
  }

  const handleReview = (ticker: string) => {
    const positionReview = actionCards.find((c) => c.id === "position-review");
    if (positionReview && onCardClick) {
      onCardClick(positionReview, ticker);
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
          Needs Review
        </h2>
        <div className="h-px flex-1 bg-border/40" />
      </div>

      <div className="space-y-1.5">
        {top5.map((c) => (
          <div
            key={c.id}
            className="group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-border/50 hover:bg-muted/30"
          >
            {/* Ticker + Company */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-foreground">
                  {c.ticker}
                </span>
                <span className="truncate text-[12px] text-muted-foreground">
                  {c.companyName}
                </span>
              </div>
            </div>

            {/* Stance badge */}
            <Badge
              variant="outline"
              className={`text-[10px] capitalize ${stanceColors[c.stance] ?? ""}`}
            >
              {c.stance}
            </Badge>

            {/* Days stale */}
            <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
              <Clock className="size-3" />
              <span className="tabular-nums">{c.daysSinceReview}d</span>
            </div>

            {/* Review action */}
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2 text-[11px] opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => {
                handleReview(c.ticker);
              }}
            >
              Review
              <ArrowRight className="size-3" />
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
