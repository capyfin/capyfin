import {
  BellIcon,
  ListChecksIcon,
  PlusIcon,
  SearchIcon,
  TrendingUpIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { WATCHLIST_EMPTY_TEXT } from "./WatchlistWorkspace";

interface WatchlistEmptyStateProps {
  onAdd: () => void;
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
const WATCHLIST_FEATURES = [
  {
    icon: TrendingUpIcon,
    label: "Track price moves & thesis drift",
    color: "text-emerald-500",
    bg: "bg-emerald-500/[0.08]",
    ring: "ring-emerald-500/10",
  },
  {
    icon: SearchIcon,
    label: "Run analyses on any name",
    color: "text-blue-500",
    bg: "bg-blue-500/[0.08]",
    ring: "ring-blue-500/10",
  },
  {
    icon: BellIcon,
    label: "Set up alerts & monitoring",
    color: "text-amber-500",
    bg: "bg-amber-500/[0.08]",
    ring: "ring-amber-500/10",
  },
];
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

export function WatchlistEmptyState({ onAdd }: WatchlistEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 py-12">
      <EmptyState
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lucide-react icon types
        icon={ListChecksIcon}
        iconColor="blue"
        heading="Start your watchlist"
        description={WATCHLIST_EMPTY_TEXT}
        className="flex flex-col items-center gap-5"
      >
        <Button size="sm" onClick={onAdd}>
          <PlusIcon className="size-3.5" />
          Add Ticker
        </Button>
      </EmptyState>

      <div className="w-full max-w-md">
        <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
          Your watchlist lets you
        </p>
        <div className="flex flex-col gap-2.5">
          {WATCHLIST_FEATURES.map((feature) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lucide-react icon types
            const Icon = feature.icon;
            return (
              <div
                key={feature.label}
                className="flex items-center gap-3.5 rounded-xl border border-border/40 bg-card/30 px-4 py-3.5 transition-colors dark:bg-card/20"
              >
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 ${feature.bg} ${feature.ring}`}
                >
                  <Icon className={`size-4 ${feature.color}`} />
                </div>
                <span className="text-[13px] font-medium text-foreground/80">
                  {feature.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
