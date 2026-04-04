import {
  AlertTriangle,
  TrendingDown,
  Radio,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AttentionMetrics } from "../attention-utils";

interface AttentionSummaryProps {
  metrics: AttentionMetrics;
}

interface MetricBadge {
  label: string;
  count: number;
  icon: LucideIcon;
  href: string;
  color: string;
}

export function AttentionSummary({ metrics }: AttentionSummaryProps) {
  const badges: MetricBadge[] = [
    {
      label: "Stale reviews",
      count: metrics.staleCaseCount,
      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide icon type */
      icon: AlertTriangle,
      href: "#cases",
      color: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Confidence changes",
      count: metrics.confidenceChangeCount,
      icon: TrendingDown,
      href: "#cases",
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Watchlist signals",
      count: metrics.watchlistSignalCount,
      icon: Radio,
      href: "#watchlist",
      color: "text-emerald-600 dark:text-emerald-400",
    },
    /* eslint-enable @typescript-eslint/no-unsafe-assignment */
  ];

  const activeBadges = badges.filter((b) => b.count > 0);

  if (activeBadges.length === 0) {
    return (
      <div className="rounded-xl border border-border/40 bg-emerald-500/[0.04] px-5 py-4 dark:bg-emerald-500/[0.06]">
        <p className="text-[13px] font-medium text-emerald-700 dark:text-emerald-400">
          All caught up — no items need your attention right now.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {activeBadges.map((b) => {
        /* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
        const Icon = b.icon;
        /* eslint-enable @typescript-eslint/no-unsafe-assignment */
        return (
          <button
            key={b.label}
            type="button"
            onClick={() => {
              window.location.hash = b.href;
            }}
            className="group/metric"
          >
            <Badge
              variant="outline"
              className="cursor-pointer gap-1.5 px-3 py-1 text-[12px] transition-colors group-hover/metric:bg-muted/60"
            >
              <Icon className={`size-3 ${b.color}`} />
              <span className="font-semibold tabular-nums">{b.count}</span>
              <span className="text-muted-foreground">{b.label}</span>
            </Badge>
          </button>
        );
      })}
    </div>
  );
}
