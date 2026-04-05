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
  { icon: TrendingUpIcon, label: "Track price moves & thesis drift" },
  { icon: SearchIcon, label: "Run analyses on any name" },
  { icon: BellIcon, label: "Set up alerts & monitoring" },
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

      <div className="w-full max-w-sm">
        <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
          Your watchlist lets you
        </p>
        <div className="flex flex-col gap-2">
          {WATCHLIST_FEATURES.map((feature) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lucide-react icon types
            const Icon = feature.icon;
            return (
              <div
                key={feature.label}
                className="flex items-center gap-3 rounded-xl border border-border/30 bg-card/40 px-4 py-2.5 opacity-60"
              >
                <Icon className="size-3.5 shrink-0 text-blue-400/70" />
                <span className="text-[12px] text-muted-foreground">
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
