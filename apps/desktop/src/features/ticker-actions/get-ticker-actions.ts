import type { ActionCard } from "@/features/launchpad/types";
import {
  actionCards,
  portfolioCards,
} from "@/features/launchpad/card-registry";

export function getTickerActions(): ActionCard[] {
  return [...actionCards, ...portfolioCards].filter(
    (card) => card.input === "ticker",
  );
}
