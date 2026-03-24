import type { ActionCard } from "@/features/launchpad/types";
import { getTickerActions } from "@/features/ticker-actions/get-ticker-actions";

export const WATCHLIST_CARD_ACTIONS: ActionCard[] = getTickerActions();
