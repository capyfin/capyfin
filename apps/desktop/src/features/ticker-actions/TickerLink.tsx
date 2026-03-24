import type { ActionCard } from "@/features/launchpad/types";
import { TickerActionMenu } from "./TickerActionMenu";

interface TickerLinkProps {
  ticker: string;
  onAction: (card: ActionCard, ticker: string) => void;
  onAddToWatchlist?: ((ticker: string) => void) | undefined;
}

export function TickerLink({
  ticker,
  onAction,
  onAddToWatchlist,
}: TickerLinkProps) {
  return (
    <TickerActionMenu
      ticker={ticker}
      onAction={onAction}
      onAddToWatchlist={onAddToWatchlist}
    >
      <button
        type="button"
        className="cursor-pointer font-medium text-primary underline decoration-primary/30 underline-offset-2 transition-colors hover:text-primary/80 hover:decoration-primary/50"
      >
        {ticker}
      </button>
    </TickerActionMenu>
  );
}
