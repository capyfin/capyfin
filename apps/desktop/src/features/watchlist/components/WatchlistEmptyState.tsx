import { ListChecksIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { WATCHLIST_EMPTY_TEXT } from "./WatchlistWorkspace";

interface WatchlistEmptyStateProps {
  onAdd: () => void;
}

export function WatchlistEmptyState({ onAdd }: WatchlistEmptyStateProps) {
  return (
    <EmptyState
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lucide-react icon types
      icon={ListChecksIcon}
      iconColor="blue"
      heading="Start your watchlist"
      description={WATCHLIST_EMPTY_TEXT}
    >
      <Button size="sm" onClick={onAdd}>
        <PlusIcon className="size-3.5" />
        Add Ticker
      </Button>
    </EmptyState>
  );
}
