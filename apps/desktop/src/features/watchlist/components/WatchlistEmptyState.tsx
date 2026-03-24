import { ListChecksIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WATCHLIST_EMPTY_TEXT } from "./WatchlistWorkspace";

interface WatchlistEmptyStateProps {
  onAdd: () => void;
}

export function WatchlistEmptyState({ onAdd }: WatchlistEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
        <ListChecksIcon className="size-5 text-muted-foreground" />
      </div>
      <h2 className="text-[15px] font-semibold text-foreground">Watchlist</h2>
      <p className="max-w-sm text-center text-sm text-muted-foreground">
        {WATCHLIST_EMPTY_TEXT}
      </p>
      <Button variant="outline" size="sm" onClick={onAdd}>
        <PlusIcon className="size-3.5" />
        Add Ticker
      </Button>
    </div>
  );
}
