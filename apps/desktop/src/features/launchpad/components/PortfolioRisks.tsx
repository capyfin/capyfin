import { ShieldAlert, AlertTriangle, Clock } from "lucide-react";
import type { PortfolioRiskSummary } from "../attention-utils";

interface PortfolioRisksProps {
  risks: PortfolioRiskSummary;
}

export function PortfolioRisks({ risks }: PortfolioRisksProps) {
  const hasAlerts = risks.concentrationAlerts.length > 0;
  const hasStalePositions = risks.positionsNeedingReview > 0;
  const hasHighConcentration = risks.topHoldingWeight >= 15;

  if (!hasAlerts && !hasStalePositions && !hasHighConcentration) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
          Portfolio Risks &amp; Concentration
        </h2>
        <div className="h-px flex-1 bg-border/50" />
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] px-5 py-4 dark:bg-amber-500/[0.05]">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
            <ShieldAlert className="size-4 text-amber-600 dark:text-amber-400" />
          </div>

          <div className="min-w-0 flex-1 space-y-2.5">
            {/* Concentration alerts */}
            {hasAlerts && (
              <div className="space-y-1">
                {risks.concentrationAlerts.map((alert) => (
                  <div
                    key={`${alert.type}-${alert.name}`}
                    className="flex items-center gap-2 text-[12px]"
                  >
                    <AlertTriangle className="size-3 shrink-0 text-amber-500" />
                    <span className="text-muted-foreground">
                      {alert.type === "position" ? (
                        <>
                          <span className="font-medium text-foreground">
                            {alert.name}
                          </span>{" "}
                          at {alert.weight.toFixed(1)}% of portfolio
                        </>
                      ) : (
                        <>
                          <span className="font-medium text-foreground">
                            {alert.name}
                          </span>{" "}
                          sector at {alert.weight.toFixed(1)}%
                        </>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Top holding info */}
            {hasHighConcentration &&
              risks.topHoldingTicker &&
              !risks.concentrationAlerts.some(
                (a) =>
                  a.type === "position" && a.name === risks.topHoldingTicker,
              ) && (
                <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                  <ShieldAlert className="size-3 shrink-0 text-amber-500/60" />
                  <span>
                    Top holding{" "}
                    <span className="font-medium text-foreground">
                      {risks.topHoldingTicker}
                    </span>{" "}
                    is {risks.topHoldingWeight.toFixed(1)}% of portfolio
                  </span>
                </div>
              )}

            {/* Positions needing review */}
            {hasStalePositions && (
              <button
                type="button"
                onClick={() => {
                  window.location.hash = "#portfolio";
                }}
                className="flex items-center gap-2 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
              >
                <Clock className="size-3 shrink-0 text-amber-500/60" />
                <span>
                  {risks.positionsNeedingReview} position
                  {risks.positionsNeedingReview !== 1 ? "s" : ""} overdue for
                  review
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
