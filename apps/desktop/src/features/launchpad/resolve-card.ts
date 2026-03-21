import type { ActionCard } from "./types";

/**
 * Resolve a card's input and prompt based on FMP connection status.
 * When FMP is not connected (Tier 0) and the card has a tier0Override,
 * the override's input and prompt replace the defaults.
 */
export function resolveCard(
  card: ActionCard,
  isFmpConnected: boolean,
): ActionCard {
  if (!card.tier0Override || isFmpConnected) {
    return card;
  }
  return {
    ...card,
    input: card.tier0Override.input,
    prompt: card.tier0Override.prompt,
  };
}
