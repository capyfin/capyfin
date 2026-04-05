import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAttentionBullets,
  buildRecentUpdates,
  buildUpcomingCatalysts,
  buildPortfolioAlerts,
  buildMarketContext,
} from "./home-utils";
import type {
  AttentionItem,
  InvestmentCase,
  PortfolioOverview,
} from "@capyfin/contracts";

function makeAttentionItem(
  overrides: Partial<AttentionItem> = {},
): AttentionItem {
  return {
    id: "ai-1",
    caseId: "c-1",
    ticker: "AAPL",
    companyName: "Apple Inc",
    reason: "Case is stale",
    urgency: "medium",
    attentionState: "stale",
    detectedAt: "2026-04-01T00:00:00Z",
    dismissed: false,
    ...overrides,
  };
}

function makeCase(overrides: Partial<InvestmentCase> = {}): InvestmentCase {
  return {
    id: "c-1",
    ticker: "AAPL",
    companyName: "Apple Inc",
    stance: "BULLISH",
    confidence: "HIGH",
    lastReviewedAt: "2026-03-01T00:00:00Z",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-03-01T00:00:00Z",
    sections: [],
    keyAssumptions: [],
    invalidationSignals: [],
    nextActions: [],
    history: [],
    tags: [],
    monitoringEnabled: false,
    staleDays: 30,
    ...overrides,
  } as InvestmentCase;
}

// ---------------------------------------------------------------------------
// buildAttentionBullets
// ---------------------------------------------------------------------------

void test("buildAttentionBullets returns empty array when no items", () => {
  const result = buildAttentionBullets([], 0);
  assert.equal(result.length, 0);
});

void test("buildAttentionBullets groups stale items", () => {
  const items = [
    makeAttentionItem({ attentionState: "stale", ticker: "AAPL" }),
    makeAttentionItem({
      id: "ai-2",
      attentionState: "stale",
      ticker: "MSFT",
    }),
  ];
  const result = buildAttentionBullets(items, 0);
  const staleBullet = result.find((b) => b.category === "stale");
  assert.ok(staleBullet, "Should have a stale bullet");
  assert.ok(staleBullet.message.includes("2"));
});

void test("buildAttentionBullets groups review-now items", () => {
  const items = [makeAttentionItem({ attentionState: "review-now" })];
  const result = buildAttentionBullets(items, 0);
  const reviewBullet = result.find((b) => b.category === "review-now");
  assert.ok(reviewBullet, "Should have a review-now bullet");
  assert.equal(reviewBullet.urgency, "high");
});

void test("buildAttentionBullets groups drift-detected items", () => {
  const items = [makeAttentionItem({ attentionState: "drift-detected" })];
  const result = buildAttentionBullets(items, 0);
  const driftBullet = result.find((b) => b.category === "drift-detected");
  assert.ok(driftBullet, "Should have a drift-detected bullet");
  assert.equal(driftBullet.urgency, "high");
});

void test("buildAttentionBullets groups catalyst-upcoming items", () => {
  const items = [
    makeAttentionItem({ attentionState: "catalyst-upcoming" }),
    makeAttentionItem({
      id: "ai-2",
      attentionState: "catalyst-upcoming",
    }),
    makeAttentionItem({
      id: "ai-3",
      attentionState: "catalyst-upcoming",
    }),
  ];
  const result = buildAttentionBullets(items, 0);
  const catalystBullet = result.find((b) => b.category === "catalyst-upcoming");
  assert.ok(catalystBullet, "Should have a catalyst bullet");
  assert.ok(catalystBullet.message.includes("3"));
});

void test("buildAttentionBullets adds review queue count when > 0", () => {
  const result = buildAttentionBullets([], 5);
  const queueBullet = result.find((b) => b.category === "review-queue");
  assert.ok(queueBullet, "Should have a review-queue bullet");
  assert.ok(queueBullet.message.includes("5"));
});

void test("buildAttentionBullets skips review queue when count is 0", () => {
  const result = buildAttentionBullets([], 0);
  const queueBullet = result.find((b) => b.category === "review-queue");
  assert.equal(queueBullet, undefined);
});

void test("buildAttentionBullets limits to 5 bullets max", () => {
  const items = [
    makeAttentionItem({ id: "1", attentionState: "review-now" }),
    makeAttentionItem({ id: "2", attentionState: "drift-detected" }),
    makeAttentionItem({ id: "3", attentionState: "stale" }),
    makeAttentionItem({ id: "4", attentionState: "catalyst-upcoming" }),
    makeAttentionItem({ id: "5", attentionState: "review-soon" }),
  ];
  const result = buildAttentionBullets(items, 3);
  assert.ok(result.length <= 5, "Expected <= 5, got " + String(result.length));
});

void test("buildAttentionBullets filters dismissed items", () => {
  const items = [
    makeAttentionItem({ attentionState: "stale", dismissed: true }),
  ];
  const result = buildAttentionBullets(items, 0);
  assert.equal(result.length, 0);
});

// ---------------------------------------------------------------------------
// buildRecentUpdates
// ---------------------------------------------------------------------------

void test("buildRecentUpdates returns empty when no cases", () => {
  const result = buildRecentUpdates([]);
  assert.equal(result.length, 0);
});

void test("buildRecentUpdates flattens and sorts history entries by date desc", () => {
  const cases = [
    makeCase({
      id: "c-1",
      ticker: "AAPL",
      companyName: "Apple Inc",
      history: [
        {
          id: "h1",
          date: "2026-03-01T00:00:00Z",
          eventType: "created",
          summary: "Case created",
        },
        {
          id: "h2",
          date: "2026-04-01T00:00:00Z",
          eventType: "refreshed",
          summary: "Case refreshed after Q1",
        },
      ],
    }),
    makeCase({
      id: "c-2",
      ticker: "MSFT",
      companyName: "Microsoft",
      history: [
        {
          id: "h3",
          date: "2026-03-15T00:00:00Z",
          eventType: "earnings-update",
          summary: "Earnings reviewed",
        },
      ],
    }),
  ];
  const result = buildRecentUpdates(cases);
  assert.equal(result.length, 3);
  const first = result[0];
  const second = result[1];
  const third = result[2];
  assert.ok(first);
  assert.equal(first.ticker, "AAPL");
  assert.equal(first.summary, "Case refreshed after Q1");
  assert.ok(second);
  assert.equal(second.ticker, "MSFT");
  assert.ok(third);
  assert.equal(third.ticker, "AAPL");
});

void test("buildRecentUpdates limits to 10 entries", () => {
  const history = Array.from({ length: 15 }, (_, i) => ({
    id: "h" + String(i),
    date: "2026-04-" + String(i + 1).padStart(2, "0") + "T00:00:00Z",
    eventType: "refreshed" as const,
    summary: "Update " + String(i),
  }));
  const cases = [makeCase({ history })];
  const result = buildRecentUpdates(cases);
  assert.equal(result.length, 10);
});

void test("buildRecentUpdates includes ticker and case info", () => {
  const cases = [
    makeCase({
      id: "c-1",
      ticker: "NVDA",
      companyName: "NVIDIA",
      history: [
        {
          id: "h1",
          date: "2026-04-01T00:00:00Z",
          eventType: "refreshed",
          summary: "Case updated",
        },
      ],
    }),
  ];
  const result = buildRecentUpdates(cases);
  const first = result[0];
  assert.ok(first);
  assert.equal(first.ticker, "NVDA");
  assert.equal(first.companyName, "NVIDIA");
  assert.equal(first.caseId, "c-1");
});

// ---------------------------------------------------------------------------
// buildUpcomingCatalysts
// ---------------------------------------------------------------------------

void test("buildUpcomingCatalysts returns empty when no cases have catalysts", () => {
  const cases = [makeCase()];
  const result = buildUpcomingCatalysts(cases, new Date("2026-04-05"));
  assert.equal(result.length, 0);
});

void test("buildUpcomingCatalysts includes cases within 14 days", () => {
  const cases = [
    makeCase({
      ticker: "AAPL",
      nextCatalystDate: "2026-04-10T00:00:00Z",
      nextCatalystDescription: "Q2 Earnings",
    }),
  ];
  const result = buildUpcomingCatalysts(cases, new Date("2026-04-05"));
  assert.equal(result.length, 1);
  const first = result[0];
  assert.ok(first);
  assert.equal(first.ticker, "AAPL");
  assert.equal(first.description, "Q2 Earnings");
  assert.equal(first.daysUntil, 5);
});

void test("buildUpcomingCatalysts excludes cases beyond 14 days", () => {
  const cases = [
    makeCase({
      ticker: "AAPL",
      nextCatalystDate: "2026-04-30T00:00:00Z",
      nextCatalystDescription: "Earnings",
    }),
  ];
  const result = buildUpcomingCatalysts(cases, new Date("2026-04-05"));
  assert.equal(result.length, 0);
});

void test("buildUpcomingCatalysts sorts by date ascending (soonest first)", () => {
  const cases = [
    makeCase({
      id: "c-1",
      ticker: "MSFT",
      nextCatalystDate: "2026-04-15T00:00:00Z",
      nextCatalystDescription: "Earnings",
    }),
    makeCase({
      id: "c-2",
      ticker: "AAPL",
      nextCatalystDate: "2026-04-08T00:00:00Z",
      nextCatalystDescription: "Product event",
    }),
  ];
  const result = buildUpcomingCatalysts(cases, new Date("2026-04-05"));
  const first = result[0];
  const second = result[1];
  assert.ok(first);
  assert.equal(first.ticker, "AAPL");
  assert.ok(second);
  assert.equal(second.ticker, "MSFT");
});

void test("buildUpcomingCatalysts excludes past catalysts", () => {
  const cases = [
    makeCase({
      ticker: "AAPL",
      nextCatalystDate: "2026-03-01T00:00:00Z",
      nextCatalystDescription: "Past event",
    }),
  ];
  const result = buildUpcomingCatalysts(cases, new Date("2026-04-05"));
  assert.equal(result.length, 0);
});

void test("buildUpcomingCatalysts includes today (daysUntil = 0)", () => {
  const cases = [
    makeCase({
      ticker: "AAPL",
      nextCatalystDate: "2026-04-05T00:00:00Z",
      nextCatalystDescription: "Today event",
    }),
  ];
  const result = buildUpcomingCatalysts(cases, new Date("2026-04-05"));
  assert.equal(result.length, 1);
  const first = result[0];
  assert.ok(first);
  assert.equal(first.daysUntil, 0);
});

// ---------------------------------------------------------------------------
// buildPortfolioAlerts
// ---------------------------------------------------------------------------

void test("buildPortfolioAlerts returns empty array when portfolio is null", () => {
  const result = buildPortfolioAlerts(null, []);
  assert.equal(result.length, 0);
});

void test("buildPortfolioAlerts returns empty array when no holdings", () => {
  const portfolio: PortfolioOverview = {
    holdings: [],
    totalValue: 0,
    sectorExposure: [],
    concentrationAlerts: [],
  };
  const result = buildPortfolioAlerts(portfolio, []);
  assert.equal(result.length, 0);
});

void test("buildPortfolioAlerts flags concentration alerts for positions > 20%", () => {
  const portfolio: PortfolioOverview = {
    holdings: [
      {
        ticker: "AAPL",
        shares: 100,
        costBasis: 150,
        weight: 45,
        addedAt: "2026-01-01T00:00:00Z",
      },
      {
        ticker: "MSFT",
        shares: 50,
        costBasis: 300,
        weight: 30,
        addedAt: "2026-01-01T00:00:00Z",
      },
      {
        ticker: "GOOG",
        shares: 20,
        costBasis: 100,
        weight: 25,
        addedAt: "2026-01-01T00:00:00Z",
      },
    ],
    totalValue: 100000,
    sectorExposure: [],
    concentrationAlerts: [
      { type: "position", name: "AAPL", weight: 45 },
      { type: "position", name: "MSFT", weight: 30 },
    ],
  };
  const result = buildPortfolioAlerts(portfolio, []);
  const concentration = result.filter((a) => a.type === "concentration");
  assert.ok(
    concentration.length >= 1,
    "Should have at least 1 concentration alert",
  );
  const firstConc = concentration[0];
  assert.ok(firstConc);
  assert.ok(firstConc.message.includes("AAPL"));
});

void test("buildPortfolioAlerts flags stale positions without recent review", () => {
  const portfolio: PortfolioOverview = {
    holdings: [
      {
        ticker: "AAPL",
        shares: 100,
        costBasis: 150,
        weight: 50,
        addedAt: "2026-01-01T00:00:00Z",
      },
      {
        ticker: "MSFT",
        shares: 50,
        costBasis: 300,
        weight: 50,
        addedAt: "2026-01-01T00:00:00Z",
      },
    ],
    totalValue: 50000,
    sectorExposure: [],
    concentrationAlerts: [],
  };
  const cases = [
    makeCase({ ticker: "AAPL", lastReviewedAt: "2026-02-01T00:00:00Z" }),
  ];
  const now = new Date("2026-04-05T00:00:00Z");
  const result = buildPortfolioAlerts(portfolio, cases, now);
  const stale = result.filter((a) => a.type === "stale-position");
  assert.ok(stale.length >= 1, "Should flag stale AAPL");
  const firstStale = stale[0];
  assert.ok(firstStale);
  assert.ok(firstStale.message.includes("AAPL"));
});

void test("buildPortfolioAlerts flags holdings with no case as needing review", () => {
  const portfolio: PortfolioOverview = {
    holdings: [
      {
        ticker: "TSLA",
        shares: 50,
        costBasis: 200,
        weight: 40,
        addedAt: "2026-01-01T00:00:00Z",
      },
    ],
    totalValue: 10000,
    sectorExposure: [],
    concentrationAlerts: [],
  };
  const result = buildPortfolioAlerts(portfolio, []);
  const missing = result.filter((a) => a.type === "stale-position");
  assert.ok(missing.length >= 1, "Should flag TSLA as missing case");
});

void test("buildPortfolioAlerts flags sector crowding when sector weight > 40%", () => {
  const portfolio: PortfolioOverview = {
    holdings: [
      {
        ticker: "AAPL",
        shares: 100,
        costBasis: 150,
        weight: 30,
        sector: "Technology",
        addedAt: "2026-01-01T00:00:00Z",
      },
      {
        ticker: "MSFT",
        shares: 50,
        costBasis: 300,
        weight: 25,
        sector: "Technology",
        addedAt: "2026-01-01T00:00:00Z",
      },
    ],
    totalValue: 50000,
    sectorExposure: [{ sector: "Technology", weight: 55 }],
    concentrationAlerts: [{ type: "sector", name: "Technology", weight: 55 }],
  };
  const result = buildPortfolioAlerts(portfolio, []);
  const crowding = result.filter((a) => a.type === "sector-crowding");
  assert.ok(crowding.length >= 1, "Should flag Technology sector crowding");
  const firstCrowding = crowding[0];
  assert.ok(firstCrowding);
  assert.ok(firstCrowding.message.includes("Technology"));
});

void test("buildPortfolioAlerts does not flag sector crowding for single-holding sectors", () => {
  const portfolio: PortfolioOverview = {
    holdings: [
      {
        ticker: "AAPL",
        shares: 100,
        costBasis: 150,
        weight: 60,
        sector: "Technology",
        addedAt: "2026-01-01T00:00:00Z",
      },
    ],
    totalValue: 50000,
    sectorExposure: [{ sector: "Technology", weight: 60 }],
    concentrationAlerts: [{ type: "sector", name: "Technology", weight: 60 }],
  };
  const result = buildPortfolioAlerts(portfolio, []);
  const crowding = result.filter((a) => a.type === "sector-crowding");
  assert.equal(
    crowding.length,
    0,
    "Should not flag single-holding sector as crowded",
  );
});

void test("buildPortfolioAlerts sorts by severity (high first)", () => {
  const portfolio: PortfolioOverview = {
    holdings: [
      {
        ticker: "AAPL",
        shares: 100,
        costBasis: 150,
        weight: 50,
        sector: "Tech",
        addedAt: "2026-01-01T00:00:00Z",
      },
      {
        ticker: "MSFT",
        shares: 50,
        costBasis: 300,
        weight: 30,
        sector: "Tech",
        addedAt: "2026-01-01T00:00:00Z",
      },
    ],
    totalValue: 50000,
    sectorExposure: [{ sector: "Tech", weight: 80 }],
    concentrationAlerts: [
      { type: "position", name: "AAPL", weight: 50 },
      { type: "sector", name: "Tech", weight: 80 },
    ],
  };
  const cases = [
    makeCase({ ticker: "AAPL", lastReviewedAt: "2026-01-01T00:00:00Z" }),
  ];
  const now = new Date("2026-04-05T00:00:00Z");
  const result = buildPortfolioAlerts(portfolio, cases, now);
  assert.ok(result.length >= 2);
  const firstResult = result[0];
  assert.ok(firstResult);
  assert.equal(
    firstResult.severity,
    "high",
    "First alert should be high severity",
  );
});

// ---------------------------------------------------------------------------
// buildMarketContext
// ---------------------------------------------------------------------------

void test("buildMarketContext returns empty array when no watchlist and no portfolio", () => {
  const result = buildMarketContext(null, [], []);
  assert.equal(result.length, 0);
});

void test("buildMarketContext returns exposure summary when portfolio has holdings", () => {
  const portfolio: PortfolioOverview = {
    holdings: [
      {
        ticker: "AAPL",
        shares: 100,
        costBasis: 150,
        weight: 50,
        sector: "Technology",
        addedAt: "2026-01-01T00:00:00Z",
      },
      {
        ticker: "MSFT",
        shares: 50,
        costBasis: 300,
        weight: 50,
        sector: "Technology",
        addedAt: "2026-01-01T00:00:00Z",
      },
    ],
    totalValue: 50000,
    sectorExposure: [{ sector: "Technology", weight: 100 }],
    concentrationAlerts: [],
  };
  const result = buildMarketContext(portfolio, [], []);
  assert.ok(result.length >= 1, "Should have at least 1 context item");
  const exposure = result.find((r) => r.type === "exposure-summary");
  assert.ok(exposure, "Should have an exposure summary");
});

void test("buildMarketContext includes sector leadership from portfolio", () => {
  const portfolio: PortfolioOverview = {
    holdings: [
      {
        ticker: "AAPL",
        shares: 100,
        costBasis: 150,
        weight: 50,
        sector: "Technology",
        addedAt: "2026-01-01T00:00:00Z",
      },
      {
        ticker: "JPM",
        shares: 20,
        costBasis: 100,
        weight: 30,
        sector: "Financials",
        addedAt: "2026-01-01T00:00:00Z",
      },
      {
        ticker: "JNJ",
        shares: 10,
        costBasis: 50,
        weight: 20,
        sector: "Healthcare",
        addedAt: "2026-01-01T00:00:00Z",
      },
    ],
    totalValue: 50000,
    sectorExposure: [
      { sector: "Technology", weight: 50 },
      { sector: "Financials", weight: 30 },
      { sector: "Healthcare", weight: 20 },
    ],
    concentrationAlerts: [],
  };
  const result = buildMarketContext(portfolio, [], []);
  const sector = result.find((r) => r.type === "sector-leadership");
  assert.ok(sector, "Should have sector leadership item");
  assert.ok(sector.message.includes("Technology"), "Should mention top sector");
});

void test("buildMarketContext includes attention summary when cases need review", () => {
  const portfolio: PortfolioOverview = {
    holdings: [
      {
        ticker: "AAPL",
        shares: 100,
        costBasis: 150,
        weight: 100,
        addedAt: "2026-01-01T00:00:00Z",
      },
    ],
    totalValue: 50000,
    sectorExposure: [],
    concentrationAlerts: [],
  };
  const watchlist = [
    {
      ticker: "MSFT",
      list: "watching" as const,
      addedAt: "2026-01-01T00:00:00Z",
    },
  ];
  const cases = [
    makeCase({ ticker: "AAPL", attentionState: "review-now" }),
    makeCase({ id: "c-2", ticker: "MSFT", attentionState: "stale" }),
  ];
  const result = buildMarketContext(portfolio, watchlist, cases);
  const attention = result.find((r) => r.type === "attention-summary");
  assert.ok(attention, "Should have an attention summary");
});

void test("buildMarketContext works with only watchlist items (no portfolio)", () => {
  const watchlist = [
    {
      ticker: "AAPL",
      list: "watching" as const,
      addedAt: "2026-01-01T00:00:00Z",
    },
    {
      ticker: "MSFT",
      list: "watching" as const,
      addedAt: "2026-01-01T00:00:00Z",
    },
  ];
  const result = buildMarketContext(null, watchlist, []);
  assert.ok(
    result.length >= 1,
    "Should have at least 1 context item with watchlist only",
  );
  const tracking = result.find((r) => r.type === "exposure-summary");
  assert.ok(tracking, "Should have tracking summary");
});
