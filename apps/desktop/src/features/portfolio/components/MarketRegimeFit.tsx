import {
  CompassIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  MinusCircleIcon,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RegimeFitItem } from "../portfolio-utils";

interface MarketRegimeFitProps {
  items: RegimeFitItem[];
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
const SENTIMENT_CONFIG: Record<
  string,
  { icon: LucideIcon; color: string; bg: string }
> = {
  positive: {
    icon: CheckCircle2Icon,
    color: "text-emerald-500/70",
    bg: "",
  },
  neutral: {
    icon: MinusCircleIcon,
    color: "text-blue-500/70",
    bg: "",
  },
  caution: {
    icon: AlertCircleIcon,
    color: "text-amber-500/70",
    bg: "bg-amber-500/[0.03]",
  },
};
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

export function MarketRegimeFit({ items }: MarketRegimeFitProps) {
  if (items.length === 0) return null;

  return (
    <Card className="overflow-hidden rounded-xl border-border/50 shadow-sm dark:border-border/30">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/[0.08] text-violet-500 ring-1 ring-violet-500/10">
            <CompassIcon className="size-4" />
          </div>
          <div>
            <CardTitle className="text-[15px] font-semibold tracking-tight">
              Portfolio Regime Fit
            </CardTitle>
            <p className="text-[12px] text-muted-foreground/70">
              How your portfolio aligns with current conditions
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {items.map((item) => {
            const config = SENTIMENT_CONFIG[item.sentiment];
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lucide-react icon types
            const Icon = config?.icon ?? MinusCircleIcon;
            return (
              <div
                key={item.type}
                className={`flex items-start gap-3 rounded-lg px-3 py-2.5 ${config?.bg ?? ""}`}
              >
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
      </CardContent>
    </Card>
  );
}
