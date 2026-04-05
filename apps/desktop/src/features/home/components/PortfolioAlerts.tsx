import { AlertTriangle, Clock, Layers, type LucideIcon } from "lucide-react";
import type { PortfolioAlert } from "../home-utils";

interface PortfolioAlertsProps {
  alerts: PortfolioAlert[];
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
const TYPE_ICON: Record<string, LucideIcon> = {
  concentration: AlertTriangle,
  "stale-position": Clock,
  "sector-crowding": Layers,
};

const SEVERITY_STYLES: Record<string, { dot: string; text: string }> = {
  high: {
    dot: "bg-destructive",
    text: "text-foreground/90",
  },
  medium: {
    dot: "bg-amber-500",
    text: "text-foreground/80",
  },
  low: {
    dot: "bg-muted-foreground/40",
    text: "text-foreground/70",
  },
};
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

export function PortfolioAlerts({ alerts }: PortfolioAlertsProps) {
  if (alerts.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/40">
          Portfolio Alerts
        </h2>
        <div className="h-px flex-1 bg-border/30" />
      </div>
      <div className="space-y-1">
        {alerts.map((alert, index) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lucide-react icon types
          const Icon = TYPE_ICON[alert.type] ?? AlertTriangle;
          const style = SEVERITY_STYLES[alert.severity];
          return (
            <div
              key={`${alert.type}-${alert.ticker ?? String(index)}`}
              className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/40"
            >
              <Icon className="size-4 shrink-0 text-muted-foreground/40" />
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span
                  className={`size-1.5 shrink-0 rounded-full ${style?.dot ?? "bg-muted-foreground/40"}`}
                />
                <span
                  className={`text-[12px] ${style?.text ?? "text-foreground/70"}`}
                >
                  {alert.message}
                </span>
              </div>
              {alert.ticker && (
                <span className="inline-flex shrink-0 items-center rounded-md bg-foreground/[0.05] px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wide dark:bg-foreground/[0.07]">
                  {alert.ticker}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
