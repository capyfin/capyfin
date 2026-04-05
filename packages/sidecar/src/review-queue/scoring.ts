import type { AttentionState } from "@capyfin/contracts";

export interface ReviewScoreContext {
  isHolding: boolean;
  positionWeight: number;
  daysUntilCatalyst: number | null;
}

const ATTENTION_WEIGHTS: Record<string, number> = {
  "review-now": 100,
  "drift-detected": 80,
  stale: 60,
  "catalyst-upcoming": 50,
  "review-soon": 30,
};

export function computeReviewScore(
  attentionState: AttentionState,
  daysSinceReview: number,
  context: ReviewScoreContext,
): number {
  const attentionWeight = ATTENTION_WEIGHTS[attentionState] ?? 0;
  const daysWeight = (Math.min(daysSinceReview, 90) / 90) * 20;
  const holdingWeight = context.isHolding ? 15 : 0;
  const positionSizeWeight = (Math.min(context.positionWeight, 25) / 25) * 10;

  let catalystWeight = 0;
  if (
    context.daysUntilCatalyst !== null &&
    context.daysUntilCatalyst >= 0 &&
    context.daysUntilCatalyst <= 7
  ) {
    catalystWeight = ((7 - context.daysUntilCatalyst) / 7) * 10;
  }

  return (
    attentionWeight +
    daysWeight +
    holdingWeight +
    positionSizeWeight +
    catalystWeight
  );
}
