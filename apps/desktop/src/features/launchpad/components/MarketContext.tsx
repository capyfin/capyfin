import { Globe, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

/**
 * Today's Market Context — a simplified, static market context block
 * that provides regime summary, index snapshot, and sector signals.
 *
 * Per spec 9.4: "A short, disciplined overview of the current market state."
 * This is a simplified version that uses available data signals.
 */
export function MarketContext() {
  return (
    <section className="rounded-lg border border-border/40 bg-card/30 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
          Today&apos;s Market Context
        </h2>
        <div className="h-px flex-1 bg-border/50" />
      </div>

      <div className="rounded-xl border border-blue-500/15 bg-gradient-to-br from-blue-500/[0.04] via-background to-indigo-500/[0.03] px-5 py-4 dark:border-blue-500/10 dark:from-blue-500/[0.06] dark:to-indigo-500/[0.04]">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 ring-2 ring-blue-500/[0.06]">
            <Globe className="size-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            {/* Regime summary */}
            <div>
              <p className="text-[13px] font-medium text-foreground">
                Market regime data not yet connected
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground/70">
                Connect a data provider in Settings to receive live market
                context including regime analysis, index levels, and sector
                rotation signals.
              </p>
            </div>

            {/* Signal placeholders */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 rounded-md border border-border/30 bg-muted/20 px-2.5 py-1.5 dark:bg-muted/10">
                <TrendingUp className="size-3 text-muted-foreground/40" />
                <span className="text-[11px] text-muted-foreground/50">
                  Index snapshot
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-md border border-border/30 bg-muted/20 px-2.5 py-1.5 dark:bg-muted/10">
                <BarChart3 className="size-3 text-muted-foreground/40" />
                <span className="text-[11px] text-muted-foreground/50">
                  Sector leadership
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-md border border-border/30 bg-muted/20 px-2.5 py-1.5 dark:bg-muted/10">
                <TrendingDown className="size-3 text-muted-foreground/40" />
                <span className="text-[11px] text-muted-foreground/50">
                  Sector weakness
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
