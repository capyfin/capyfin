import { Globe, PieChart, TrendingUp, type LucideIcon } from "lucide-react";
import type { MarketContextItem } from "../home-utils";

interface PersonalizedMarketContextProps {
  items: MarketContextItem[];
  embedded?: boolean;
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
const TYPE_CONFIG: Record<string, { icon: LucideIcon; color: string }> = {
  "exposure-summary": {
    icon: Globe,
    color: "text-blue-500/70",
  },
  "sector-leadership": {
    icon: PieChart,
    color: "text-emerald-500/70",
  },
  "attention-summary": {
    icon: TrendingUp,
    color: "text-amber-500/70",
  },
};
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

export function PersonalizedMarketContext({
  items,
  embedded,
}: PersonalizedMarketContextProps) {
  if (items.length === 0) return null;

  const content = (
    <div
      className={
        embedded
          ? "px-3 py-2.5"
          : "rounded-xl border border-border/50 bg-muted/30 px-4 py-3"
      }
    >
      {!embedded && (
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/50">
          Market Context
        </p>
      )}
      <div className="space-y-2.5">
        {items.map((item) => {
          const config = TYPE_CONFIG[item.type];
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lucide-react icon types
          const Icon = config?.icon ?? Globe;
          return (
            <div key={item.type} className="flex items-start gap-3">
              <Icon
                className={`mt-0.5 size-3.5 shrink-0 ${config?.color ?? "text-muted-foreground/40"}`}
              />
              <span className="text-[13px] leading-snug text-foreground/80">
                {item.message}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (embedded) return content;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/40">
          Market Context
        </h2>
        <div className="h-px flex-1 bg-border/30" />
      </div>
      {content}
    </section>
  );
}
