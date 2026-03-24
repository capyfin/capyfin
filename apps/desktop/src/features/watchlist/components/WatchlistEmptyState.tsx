import { ListChecksIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WATCHLIST_EMPTY_TEXT } from "./WatchlistWorkspace";

interface WatchlistEmptyStateProps {
  onAdd: () => void;
}

export function WatchlistEmptyState({ onAdd }: WatchlistEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 py-20">
      <div className="relative">
        <div className="absolute -inset-3 rounded-2xl bg-blue-500/[0.06] blur-xl dark:bg-blue-500/[0.08]" />
        <div className="relative flex size-14 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/[0.08] dark:bg-blue-500/[0.1]">
          <ListChecksIcon className="size-6 text-blue-500" />
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-[17px] font-semibold text-foreground">
          Start your watchlist
        </h2>
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
          {WATCHLIST_EMPTY_TEXT}
        </p>
      </div>
      <Button size="sm" onClick={onAdd}>
        <PlusIcon className="size-3.5" />
        Add Ticker
      </Button>
    </div>
  );
}
