import assert from "node:assert/strict";
import test from "node:test";
import { ReviewQueueService } from "./service.ts";
import type {
  InvestmentCase,
  WatchlistItem,
  PortfolioOverview,
} from "@capyfin/contracts";

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function makeCase(overrides: Partial<InvestmentCase> = {}): InvestmentCase {
  const now = new Date().toISOString();
  return {
    id: "case-1",
    ticker: "AAPL",
    companyName: "Apple Inc.",
    stance: "bullish",
    confidence: "HIGH",
    lastReviewedAt: now,
    createdAt: now,
    updatedAt: now,
    sections: [],
    keyAssumptions: [],
    invalidationSignals: [],
    nextActions: [],
    history: [],
    tags: [],
    monitoringEnabled: true,
    staleDays: 30,
    attentionState: "stale",
    ...overrides,
  };
}

function makeWatchlistItem(
  overrides: Partial<WatchlistItem> = {},
): WatchlistItem {
  return {
    ticker: "AAPL",
    list: "watching",
    addedAt: new Date().toISOString(),
    tags: [],
    ...overrides,
  };
}

function makePortfolioOverview(
  overrides: Partial<PortfolioOverview> = {},
): PortfolioOverview {
  return {
    holdings: [],
    totalValue: 0,
    sectorExposure: [],
    concentrationAlerts: [],
    ...overrides,
  };
}

interface MockDeps {
  cases: InvestmentCase[];
  watchlist: WatchlistItem[];
  portfolio: PortfolioOverview;
}

function createService(deps: Partial<MockDeps> = {}): ReviewQueueService {
  const cases = deps.cases ?? [];
  const watchlist = deps.watchlist ?? [];
  const portfolio = deps.portfolio ?? makePortfolioOverview();

  return new ReviewQueueService(
    // eslint-disable-next-line @typescript-eslint/require-await
    { listCases: async () => cases } as never,
    // eslint-disable-next-line @typescript-eslint/require-await
    { getAll: async () => watchlist } as never,
    // eslint-disable-next-line @typescript-eslint/require-await
    { getOverview: async () => portfolio } as never,
  );
}

void test("cases with healthy state are excluded from queue", async () => {
  const service = createService({
    cases: [
      makeCase({ attentionState: "healthy", lastReviewedAt: daysAgo(5) }),
    ],
  });
  const result = await service.getQueue(10);
  assert.equal(result.items.length, 0);
});

void test("queue is sorted by score descending", async () => {
  const service = createService({
    cases: [
      makeCase({
        id: "c1",
        ticker: "LOW",
        attentionState: "review-soon",
        lastReviewedAt: daysAgo(24),
      }),
      makeCase({
        id: "c2",
        ticker: "HIGH",
        attentionState: "review-now",
        lastReviewedAt: daysAgo(50),
      }),
      makeCase({
        id: "c3",
        ticker: "MED",
        attentionState: "stale",
        lastReviewedAt: daysAgo(35),
      }),
    ],
  });
  const result = await service.getQueue(10);
  assert.equal(result.items.length, 3);
  assert.equal(result.items[0]?.ticker, "HIGH");
  assert.equal(result.items[1]?.ticker, "MED");
  assert.equal(result.items[2]?.ticker, "LOW");
});

void test("limit parameter caps the number of results", async () => {
  const service = createService({
    cases: [
      makeCase({
        id: "c1",
        ticker: "A",
        attentionState: "stale",
        lastReviewedAt: daysAgo(35),
      }),
      makeCase({
        id: "c2",
        ticker: "B",
        attentionState: "review-now",
        lastReviewedAt: daysAgo(50),
      }),
      makeCase({
        id: "c3",
        ticker: "C",
        attentionState: "review-soon",
        lastReviewedAt: daysAgo(24),
      }),
    ],
  });
  const result = await service.getQueue(2);
  assert.equal(result.items.length, 2);
});

void test("ranks are 1-based and sequential", async () => {
  const service = createService({
    cases: [
      makeCase({
        id: "c1",
        ticker: "A",
        attentionState: "stale",
        lastReviewedAt: daysAgo(35),
      }),
      makeCase({
        id: "c2",
        ticker: "B",
        attentionState: "review-now",
        lastReviewedAt: daysAgo(50),
      }),
    ],
  });
  const result = await service.getQueue(10);
  assert.equal(result.items[0]?.rank, 1);
  assert.equal(result.items[1]?.rank, 2);
});

void test("isHolding is true when ticker matches a portfolio holding", async () => {
  const service = createService({
    cases: [
      makeCase({
        id: "c1",
        ticker: "AAPL",
        attentionState: "stale",
        lastReviewedAt: daysAgo(35),
      }),
    ],
    portfolio: makePortfolioOverview({
      holdings: [
        {
          ticker: "AAPL",
          name: "Apple Inc.",
          shares: 10,
          costBasis: 150,
          weight: 15,
          addedAt: new Date().toISOString(),
        },
      ],
    }),
  });
  const result = await service.getQueue(10);
  assert.equal(result.items[0]?.isHolding, true);
});

void test("isHolding is true when ticker matches a watchlist item with list=position", async () => {
  const service = createService({
    cases: [
      makeCase({
        id: "c1",
        ticker: "NVDA",
        attentionState: "stale",
        lastReviewedAt: daysAgo(35),
      }),
    ],
    watchlist: [makeWatchlistItem({ ticker: "NVDA", list: "position" })],
  });
  const result = await service.getQueue(10);
  assert.equal(result.items[0]?.isHolding, true);
});

void test("empty portfolio is handled gracefully", async () => {
  const service = createService({
    cases: [
      makeCase({
        id: "c1",
        ticker: "AAPL",
        attentionState: "stale",
        lastReviewedAt: daysAgo(35),
      }),
    ],
    portfolio: makePortfolioOverview(),
  });
  const result = await service.getQueue(10);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0]?.isHolding, false);
});
