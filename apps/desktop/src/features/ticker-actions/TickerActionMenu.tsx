import {
  SearchIcon,
  CalculatorIcon,
  FileBarChart2Icon,
  ScaleIcon,
  ListPlusIcon,
} from "lucide-react";
import { useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { ActionCard } from "@/features/launchpad/types";
import { getTickerActions } from "./get-ticker-actions";

/* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
const ACTION_ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  "deep-dive": SearchIcon,
  "fair-value": CalculatorIcon,
  "earnings-xray": FileBarChart2Icon,
  "bull-bear": ScaleIcon,
  "position-review": SearchIcon,
};
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

interface TickerActionMenuProps {
  ticker: string;
  onAction: (card: ActionCard, ticker: string) => void;
  onAddToWatchlist?: ((ticker: string) => void) | undefined;
  children: React.ReactNode;
}

export function TickerActionMenu({
  ticker,
  onAction,
  onAddToWatchlist,
  children,
}: TickerActionMenuProps) {
  const actions = useMemo(() => getTickerActions(), []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
          {ticker}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {actions.map((card) => {
          const Icon = ACTION_ICON_MAP[card.id];
          return (
            <DropdownMenuItem
              key={card.id}
              onClick={() => {
                onAction(card, ticker);
              }}
            >
              {Icon ? <Icon className="mr-2 size-4" /> : null}
              {card.title}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            onAddToWatchlist?.(ticker);
          }}
        >
          <ListPlusIcon className="mr-2 size-4" />
          Add to Watchlist
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
