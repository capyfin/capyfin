import type {
  AttentionState,
  ReviewQueueItem,
  ReviewQueueResponse,
  Urgency,
} from "@capyfin/contracts";
import type { CasesService } from "../cases/service.ts";
import type { WatchlistService } from "../watchlist/service.ts";
import type { PortfolioService } from "../portfolio/service.ts";
import { computeReviewScore } from "./scoring.ts";

function daysBetween(date1: Date, date2: Date): number {
  const ms = date2.getTime() - date1.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function mapUrgency(state: AttentionState): Urgency {
  switch (state) {
    case "review-now":
    case "drift-detected":
      return "high";
    case "stale":
    case "catalyst-upcoming":
      return "medium";
    case "review-soon":
      return "low";
    default:
      return "low";
  }
}

function generateReason(
  ticker: string,
  state: AttentionState,
  daysSinceReview: number,
  nextCatalystDescription?: string,
  daysUntilCatalyst?: number | null,
): string {
  switch (state) {
    case "review-now":
      return `${ticker} has not been reviewed in ${String(daysSinceReview)} days and needs immediate review`;
    case "drift-detected":
      return `${ticker} has unresolved thesis drift`;
    case "stale":
      return `${ticker} has not been reviewed in ${String(daysSinceReview)} days`;
    case "catalyst-upcoming": {
      const desc = nextCatalystDescription ?? "upcoming catalyst";
      if (daysUntilCatalyst !== null && daysUntilCatalyst !== undefined) {
        return `${ticker} has an upcoming catalyst: ${desc} in ${String(daysUntilCatalyst)} days`;
      }
      return `${ticker} has an upcoming catalyst: ${desc}`;
    }
    case "review-soon":
      return `${ticker} is approaching review threshold (${String(daysSinceReview)} days since last review)`;
    default:
      return `${ticker} needs attention`;
  }
}

export class ReviewQueueService {
  readonly #casesService: CasesService;
  readonly #watchlistService: WatchlistService;
  readonly #portfolioService: PortfolioService;

  constructor(
    casesService: CasesService,
    watchlistService: WatchlistService,
    portfolioService: PortfolioService,
  ) {
    this.#casesService = casesService;
    this.#watchlistService = watchlistService;
    this.#portfolioService = portfolioService;
  }

  async getQueue(limit = 10): Promise<ReviewQueueResponse> {
    const [cases, watchlistItems, portfolioResult] = await Promise.all([
      this.#casesService.listCases(),
      this.#watchlistService.getAll(),
      this.#portfolioService.getOverview().catch(() => ({
        holdings: [] as { ticker: string; weight: number }[],
      })),
    ]);

    // Build lookup sets/maps
    const holdingTickers = new Set<string>();
    for (const item of watchlistItems) {
      if (item.list === "position") {
        holdingTickers.add(item.ticker.toUpperCase());
      }
    }
    const positionWeightMap = new Map<string, number>();
    for (const h of portfolioResult.holdings) {
      const t = h.ticker.toUpperCase();
      holdingTickers.add(t);
      positionWeightMap.set(t, h.weight);
    }

    const now = new Date();
    const scored: {
      item: Omit<ReviewQueueItem, "rank">;
      score: number;
      daysSinceReview: number;
    }[] = [];

    for (const c of cases) {
      const state = c.attentionState ?? "healthy";
      if (state === "healthy") continue;

      const daysSinceReview = daysBetween(new Date(c.lastReviewedAt), now);
      const ticker = c.ticker.toUpperCase();
      const isHolding = holdingTickers.has(ticker);
      const positionWeight = positionWeightMap.get(ticker) ?? 0;

      let daysUntilCatalyst: number | null = null;
      if (c.nextCatalystDate) {
        daysUntilCatalyst = daysBetween(now, new Date(c.nextCatalystDate));
      }

      const score = computeReviewScore(state, daysSinceReview, {
        isHolding,
        positionWeight,
        daysUntilCatalyst,
      });

      const reason = generateReason(
        c.ticker,
        state,
        daysSinceReview,
        c.nextCatalystDescription,
        daysUntilCatalyst,
      );

      scored.push({
        item: {
          caseId: c.id,
          ticker: c.ticker,
          companyName: c.companyName,
          reason,
          urgency: mapUrgency(state),
          attentionState: state,
          lastReviewedAt: c.lastReviewedAt,
          daysSinceReview,
          isHolding,
          ...(c.nextCatalystDate
            ? { nextCatalystDate: c.nextCatalystDate }
            : {}),
        },
        score,
        daysSinceReview,
      });
    }

    // Sort by score descending, tiebreak by daysSinceReview descending
    scored.sort(
      (a, b) => b.score - a.score || b.daysSinceReview - a.daysSinceReview,
    );

    const items: ReviewQueueItem[] = scored.slice(0, limit).map((s, i) => ({
      ...s.item,
      rank: i + 1,
    }));

    return {
      items,
      generatedAt: now.toISOString(),
    };
  }
}
