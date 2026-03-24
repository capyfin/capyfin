import { ListChecksIcon } from "lucide-react";

export const WATCHLIST_EMPTY_TEXT =
  "Your watchlist is empty. Add tickers and assets to track them here.";

export function WatchlistWorkspace() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-3 py-16">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
        <ListChecksIcon className="size-5 text-muted-foreground" />
      </div>
      <h2 className="text-[15px] font-semibold text-foreground">Watchlist</h2>
      <p className="max-w-sm text-center text-sm text-muted-foreground">
        {WATCHLIST_EMPTY_TEXT}
      </p>
    </div>
  );
}
