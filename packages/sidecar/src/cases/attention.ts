import type { AttentionState, InvestmentCase } from "@capyfin/contracts";

function daysBetween(date1: Date, date2: Date): number {
  const ms = date2.getTime() - date1.getTime();
  return ms / (1000 * 60 * 60 * 24);
}

function hasUnresolvedDrift(history: InvestmentCase["history"]): boolean {
  for (let i = history.length - 1; i >= 0; i--) {
    const eventType = history[i]?.eventType;
    if (eventType === "refreshed") {
      return false;
    }
    if (eventType === "drift-detected") {
      return true;
    }
  }
  return false;
}

export function computeAttentionState(
  investmentCase: InvestmentCase,
): AttentionState {
  const now = new Date();
  const lastReviewed = new Date(investmentCase.lastReviewedAt);
  const daysSinceReview = daysBetween(lastReviewed, now);
  const staleDays = investmentCase.staleDays;

  // Priority order: review-now > drift-detected > stale > catalyst-upcoming > review-soon > healthy

  if (daysSinceReview >= staleDays * 1.5) {
    return "review-now";
  }

  if (hasUnresolvedDrift(investmentCase.history)) {
    return "drift-detected";
  }

  if (daysSinceReview >= staleDays) {
    return "stale";
  }

  if (investmentCase.nextCatalystDate) {
    const catalystDate = new Date(investmentCase.nextCatalystDate);
    const daysUntilCatalyst = daysBetween(now, catalystDate);
    if (daysUntilCatalyst >= 0 && daysUntilCatalyst <= 7) {
      return "catalyst-upcoming";
    }
  }

  if (daysSinceReview >= staleDays * 0.75) {
    return "review-soon";
  }

  return "healthy";
}
