import assert from "node:assert/strict";
import test from "node:test";
import type { InvestmentCase, WatchlistItem } from "@capyfin/contracts";
import type { PortfolioOverview } from "@capyfin/contracts";
import {
  daysBetween,
  computeStaleCases,
  computeConfidenceChanges,
  extractCatalysts,
  computeWatchlistSignals,
  computeAttentionMetrics,
  computeWatchlistChanges,
  computePortfolioRisks,
} from "./attention-utils";

// ---------------------------------------------------------------------------
// Helpers — factory for minimal InvestmentCase test data
// ---------------------------------------------------------------------------

function makeCase(overrides: Partial<InvestmentCase> = {}): InvestmentCase {
  return {
    id: "case-1",
    ticker: "AAPL",
    companyName: "Apple Inc.",
    stance: "bullish",
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
  };
}

function makeWatchlistItem(
  overrides: Partial<WatchlistItem> = {},
): WatchlistItem {
  return {
    ticker: "AAPL",
    list: "watching",
    addedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// daysBetween
// ---------------------------------------------------------------------------

void test("daysBetween returns correct number of days", () => {
  const now = new Date("2026-04-04T12:00:00Z");
  assert.equal(daysBetween("2026-04-04T00:00:00Z", now), 0);
  assert.equal(daysBetween("2026-04-03T00:00:00Z", now), 1);
  assert.equal(daysBetween("2026-03-05T00:00:00Z", now), 30);
});

// ---------------------------------------------------------------------------
// computeStaleCases
// ---------------------------------------------------------------------------

void test("computeStaleCases returns cases older than threshold", () => {
  const now = new Date("2026-04-04T00:00:00Z");
  const cases = [
    makeCase({
      id: "stale",
      ticker: "MSFT",
      lastReviewedAt: "2026-02-01T00:00:00Z",
    }),
    makeCase({
      id: "fresh",
      ticker: "GOOG",
      lastReviewedAt: "2026-04-01T00:00:00Z",
    }),
  ];
  const stale = computeStaleCases(cases, 30, now);
  assert.equal(stale.length, 1);
  const first = stale[0];
  assert.ok(first);
  assert.equal(first.ticker, "MSFT");
  assert.ok(first.daysSinceReview >= 30);
});

void test("computeStaleCases sorts by staleness descending", () => {
  const now = new Date("2026-04-04T00:00:00Z");
  const cases = [
    makeCase({
      id: "a",
      ticker: "A",
      lastReviewedAt: "2026-02-15T00:00:00Z",
    }),
    makeCase({
      id: "b",
      ticker: "B",
      lastReviewedAt: "2026-01-01T00:00:00Z",
    }),
  ];
  const stale = computeStaleCases(cases, 30, now);
  assert.equal(stale.length, 2);
  const [first, second] = stale;
  assert.ok(first);
  assert.ok(second);
  assert.equal(first.ticker, "B");
  assert.equal(second.ticker, "A");
});

void test("computeStaleCases returns empty array when all cases are fresh", () => {
  const now = new Date("2026-04-04T00:00:00Z");
  const cases = [makeCase({ lastReviewedAt: "2026-04-01T00:00:00Z" })];
  assert.equal(computeStaleCases(cases, 30, now).length, 0);
});

// ---------------------------------------------------------------------------
// computeConfidenceChanges
// ---------------------------------------------------------------------------

void test("computeConfidenceChanges counts cases with recent confidence changes", () => {
  const now = new Date("2026-04-04T00:00:00Z");
  const cases = [
    makeCase({
      id: "changed",
      history: [
        {
          id: "h1",
          date: "2026-03-20T00:00:00Z",
          eventType: "refreshed",
          summary: "Refreshed",
          priorConfidence: "HIGH",
          newConfidence: "MEDIUM",
        },
      ],
    }),
    makeCase({
      id: "unchanged",
      history: [
        {
          id: "h2",
          date: "2026-03-20T00:00:00Z",
          eventType: "refreshed",
          summary: "Refreshed",
          priorConfidence: "HIGH",
          newConfidence: "HIGH",
        },
      ],
    }),
  ];
  assert.equal(computeConfidenceChanges(cases, 30, now), 1);
});

void test("computeConfidenceChanges ignores changes older than threshold", () => {
  const now = new Date("2026-04-04T00:00:00Z");
  const cases = [
    makeCase({
      history: [
        {
          id: "h1",
          date: "2026-01-01T00:00:00Z",
          eventType: "refreshed",
          summary: "Old change",
          priorConfidence: "HIGH",
          newConfidence: "LOW",
        },
      ],
    }),
  ];
  assert.equal(computeConfidenceChanges(cases, 30, now), 0);
});

void test("computeConfidenceChanges counts each case at most once", () => {
  const now = new Date("2026-04-04T00:00:00Z");
  const cases = [
    makeCase({
      history: [
        {
          id: "h1",
          date: "2026-03-20T00:00:00Z",
          eventType: "refreshed",
          summary: "First",
          priorConfidence: "HIGH",
          newConfidence: "MEDIUM",
        },
        {
          id: "h2",
          date: "2026-03-25T00:00:00Z",
          eventType: "refreshed",
          summary: "Second",
          priorConfidence: "MEDIUM",
          newConfidence: "LOW",
        },
      ],
    }),
  ];
  assert.equal(computeConfidenceChanges(cases, 30, now), 1);
});

// ---------------------------------------------------------------------------
// extractCatalysts
// ---------------------------------------------------------------------------

void test("extractCatalysts finds cases with Catalysts section", () => {
  const cases = [
    makeCase({
      id: "c1",
      ticker: "NVDA",
      companyName: "NVIDIA Corp.",
      sections: [
        {
          id: "s1",
          title: "Catalysts",
          content: "Q2 earnings on Aug 28",
          confidence: "HIGH",
          citations: [],
        },
      ],
    }),
    makeCase({
      id: "c2",
      ticker: "AAPL",
      sections: [
        {
          id: "s2",
          title: "Risks",
          content: "China exposure",
          confidence: "MEDIUM",
          citations: [],
        },
      ],
    }),
  ];
  const catalysts = extractCatalysts(cases);
  assert.equal(catalysts.length, 1);
  const entry = catalysts[0];
  assert.ok(entry);
  assert.equal(entry.ticker, "NVDA");
  assert.equal(entry.description, "Q2 earnings on Aug 28");
});

void test("extractCatalysts respects limit parameter", () => {
  const cases = Array.from({ length: 10 }, (_, i) =>
    makeCase({
      id: "c" + String(i),
      ticker: "T" + String(i),
      sections: [
        {
          id: "s" + String(i),
          title: "Catalysts",
          content: "Catalyst " + String(i),
          confidence: "HIGH",
          citations: [],
        },
      ],
    }),
  );
  assert.equal(extractCatalysts(cases, 3).length, 3);
});

void test("extractCatalysts skips sections with empty content", () => {
  const cases = [
    makeCase({
      sections: [
        {
          id: "s1",
          title: "Catalysts",
          content: "  ",
          confidence: "HIGH",
          citations: [],
        },
      ],
    }),
  ];
  assert.equal(extractCatalysts(cases).length, 0);
});

void test("extractCatalysts is case-insensitive for section title", () => {
  const cases = [
    makeCase({
      sections: [
        {
          id: "s1",
          title: "catalysts",
          content: "Upcoming IPO",
          confidence: "HIGH",
          citations: [],
        },
      ],
    }),
  ];
  assert.equal(extractCatalysts(cases).length, 1);
});

// ---------------------------------------------------------------------------
// computeWatchlistSignals
// ---------------------------------------------------------------------------

void test("computeWatchlistSignals counts watchlist tickers with recent case activity", () => {
  const now = new Date("2026-04-04T00:00:00Z");
  const watchlist = [
    makeWatchlistItem({ ticker: "AAPL" }),
    makeWatchlistItem({ ticker: "MSFT" }),
  ];
  const cases = [
    makeCase({
      id: "c1",
      ticker: "AAPL",
      history: [
        {
          id: "h1",
          date: "2026-04-01T00:00:00Z",
          eventType: "refreshed",
          summary: "Fresh",
        },
      ],
    }),
    makeCase({
      id: "c2",
      ticker: "GOOG",
      history: [
        {
          id: "h2",
          date: "2026-04-01T00:00:00Z",
          eventType: "created",
          summary: "New",
        },
      ],
    }),
  ];
  assert.equal(computeWatchlistSignals(watchlist, cases, 7, now), 1);
});

void test("computeWatchlistSignals returns 0 when no watchlist items have case activity", () => {
  const now = new Date("2026-04-04T00:00:00Z");
  const watchlist = [makeWatchlistItem({ ticker: "TSLA" })];
  const cases = [
    makeCase({
      ticker: "AAPL",
      history: [
        {
          id: "h1",
          date: "2026-04-01T00:00:00Z",
          eventType: "refreshed",
          summary: "x",
        },
      ],
    }),
  ];
  assert.equal(computeWatchlistSignals(watchlist, cases, 7, now), 0);
});

// ---------------------------------------------------------------------------
// computeAttentionMetrics
// ---------------------------------------------------------------------------

void test("computeAttentionMetrics aggregates all counts", () => {
  const cases = [
    makeCase({
      id: "stale",
      ticker: "AAPL",
      lastReviewedAt: "2025-01-01T00:00:00Z",
      history: [
        {
          id: "h1",
          date: new Date().toISOString(),
          eventType: "refreshed",
          summary: "Recent",
          priorConfidence: "HIGH",
          newConfidence: "LOW",
        },
      ],
      sections: [
        {
          id: "s1",
          title: "Catalysts",
          content: "Earnings soon",
          confidence: "HIGH",
          citations: [],
        },
      ],
    }),
  ];
  const watchlist = [makeWatchlistItem({ ticker: "AAPL" })];
  const metrics = computeAttentionMetrics(cases, watchlist);
  assert.ok(metrics.staleCaseCount >= 1);
  assert.ok(metrics.confidenceChangeCount >= 1);
  assert.ok(metrics.watchlistSignalCount >= 1);
});

void test("computeAttentionMetrics handles empty data", () => {
  const metrics = computeAttentionMetrics([], []);
  assert.equal(metrics.staleCaseCount, 0);
  assert.equal(metrics.confidenceChangeCount, 0);
  assert.equal(metrics.watchlistSignalCount, 0);
});

// ---------------------------------------------------------------------------
// computeWatchlistChanges
// ---------------------------------------------------------------------------

void test("computeWatchlistChanges detects stance changes for watchlist items", () => {
  const now = new Date("2026-04-04T00:00:00Z");
  const watchlist = [makeWatchlistItem({ ticker: "AAPL" })];
  const cases = [
    makeCase({
      ticker: "AAPL",
      history: [
        {
          id: "h1",
          date: "2026-03-28T00:00:00Z",
          eventType: "refreshed",
          summary: "Stance update",
          priorStance: "bullish",
          newStance: "neutral",
        },
      ],
    }),
  ];
  const changes = computeWatchlistChanges(watchlist, cases, 14, now);
  assert.equal(changes.length, 1);
  const first = changes[0];
  assert.ok(first);
  assert.equal(first.changeType, "stance-changed");
  assert.equal(first.ticker, "AAPL");
});

void test("computeWatchlistChanges detects confidence changes", () => {
  const now = new Date("2026-04-04T00:00:00Z");
  const watchlist = [makeWatchlistItem({ ticker: "MSFT" })];
  const cases = [
    makeCase({
      ticker: "MSFT",
      history: [
        {
          id: "h1",
          date: "2026-04-01T00:00:00Z",
          eventType: "refreshed",
          summary: "Confidence shift",
          priorConfidence: "HIGH",
          newConfidence: "MEDIUM",
        },
      ],
    }),
  ];
  const changes = computeWatchlistChanges(watchlist, cases, 14, now);
  assert.equal(changes.length, 1);
  const first = changes[0];
  assert.ok(first);
  assert.equal(first.changeType, "confidence-changed");
});

void test("computeWatchlistChanges detects general case updates", () => {
  const now = new Date("2026-04-04T00:00:00Z");
  const watchlist = [makeWatchlistItem({ ticker: "GOOG" })];
  const cases = [
    makeCase({
      ticker: "GOOG",
      history: [
        {
          id: "h1",
          date: "2026-04-02T00:00:00Z",
          eventType: "refreshed",
          summary: "Earnings reviewed",
        },
      ],
    }),
  ];
  const changes = computeWatchlistChanges(watchlist, cases, 14, now);
  assert.equal(changes.length, 1);
  const first = changes[0];
  assert.ok(first);
  assert.equal(first.changeType, "case-updated");
  assert.equal(first.summary, "Earnings reviewed");
});

void test("computeWatchlistChanges ignores items older than threshold", () => {
  const now = new Date("2026-04-04T00:00:00Z");
  const watchlist = [makeWatchlistItem({ ticker: "AAPL" })];
  const cases = [
    makeCase({
      ticker: "AAPL",
      history: [
        {
          id: "h1",
          date: "2026-01-01T00:00:00Z",
          eventType: "refreshed",
          summary: "Old update",
        },
      ],
    }),
  ];
  const changes = computeWatchlistChanges(watchlist, cases, 14, now);
  assert.equal(changes.length, 0);
});

void test("computeWatchlistChanges returns empty for empty watchlist", () => {
  const changes = computeWatchlistChanges([], [], 14);
  assert.equal(changes.length, 0);
});

void test("computeWatchlistChanges sorts by most recent first", () => {
  const now = new Date("2026-04-04T00:00:00Z");
  const watchlist = [
    makeWatchlistItem({ ticker: "AAPL" }),
    makeWatchlistItem({ ticker: "MSFT" }),
  ];
  const cases = [
    makeCase({
      id: "c1",
      ticker: "AAPL",
      history: [
        {
          id: "h1",
          date: "2026-03-25T00:00:00Z",
          eventType: "refreshed",
          summary: "Older",
        },
      ],
    }),
    makeCase({
      id: "c2",
      ticker: "MSFT",
      history: [
        {
          id: "h2",
          date: "2026-04-02T00:00:00Z",
          eventType: "refreshed",
          summary: "Newer",
        },
      ],
    }),
  ];
  const changes = computeWatchlistChanges(watchlist, cases, 14, now);
  assert.equal(changes.length, 2);
  const [first, second] = changes;
  assert.ok(first);
  assert.ok(second);
  assert.equal(first.ticker, "MSFT");
  assert.equal(second.ticker, "AAPL");
});

// ---------------------------------------------------------------------------
// computePortfolioRisks
// ---------------------------------------------------------------------------

function makePortfolio(
  overrides: Partial<PortfolioOverview> = {},
): PortfolioOverview {
  return {
    holdings: [
      {
        ticker: "AAPL",
        shares: 100,
        costBasis: 150,
        weight: 25,
        addedAt: "2026-01-01T00:00:00Z",
      },
      {
        ticker: "GOOG",
        shares: 50,
        costBasis: 140,
        weight: 15,
        addedAt: "2026-01-01T00:00:00Z",
      },
    ],
    totalValue: 50000,
    sectorExposure: [{ sector: "Technology", weight: 40 }],
    concentrationAlerts: [],
    ...overrides,
  };
}

void test("computePortfolioRisks returns null for null portfolio", () => {
  assert.equal(computePortfolioRisks(null, []), null);
});

void test("computePortfolioRisks returns null for empty holdings", () => {
  const portfolio = makePortfolio({ holdings: [] });
  assert.equal(computePortfolioRisks(portfolio, []), null);
});

void test("computePortfolioRisks identifies top holding", () => {
  const portfolio = makePortfolio();
  const result = computePortfolioRisks(portfolio, []);
  assert.ok(result);
  assert.equal(result.topHoldingTicker, "AAPL");
  assert.equal(result.topHoldingWeight, 25);
});

void test("computePortfolioRisks passes through concentration alerts", () => {
  const portfolio = makePortfolio({
    concentrationAlerts: [{ type: "position", name: "AAPL", weight: 25 }],
  });
  const result = computePortfolioRisks(portfolio, []);
  assert.ok(result);
  assert.equal(result.concentrationAlerts.length, 1);
  const alert = result.concentrationAlerts[0];
  assert.ok(alert);
  assert.equal(alert.name, "AAPL");
});

void test("computePortfolioRisks counts positions needing review", () => {
  const now = new Date("2026-04-04T00:00:00Z");
  const portfolio = makePortfolio();
  const cases = [
    makeCase({
      ticker: "AAPL",
      lastReviewedAt: "2026-02-01T00:00:00Z",
    }),
    makeCase({
      id: "c2",
      ticker: "GOOG",
      lastReviewedAt: "2026-04-01T00:00:00Z",
    }),
  ];
  const result = computePortfolioRisks(portfolio, cases, 30, now);
  assert.ok(result);
  assert.equal(result.positionsNeedingReview, 1);
});

void test("computePortfolioRisks ignores cases not in portfolio", () => {
  const now = new Date("2026-04-04T00:00:00Z");
  const portfolio = makePortfolio();
  const cases = [
    makeCase({
      ticker: "TSLA",
      lastReviewedAt: "2026-01-01T00:00:00Z",
    }),
  ];
  const result = computePortfolioRisks(portfolio, cases, 30, now);
  assert.ok(result);
  assert.equal(result.positionsNeedingReview, 0);
});

void test("computePortfolioRisks filters out Unclassified sector alerts", () => {
  const portfolio = makePortfolio({
    concentrationAlerts: [
      { type: "sector", name: "Unclassified", weight: 100 },
      { type: "position", name: "AAPL", weight: 25 },
    ],
  });
  const result = computePortfolioRisks(portfolio, []);
  assert.ok(result);
  assert.equal(result.concentrationAlerts.length, 1);
  const alert = result.concentrationAlerts[0];
  assert.ok(alert);
  assert.equal(alert.name, "AAPL");
});

void test("computePortfolioRisks keeps real sector alerts", () => {
  const portfolio = makePortfolio({
    concentrationAlerts: [{ type: "sector", name: "Technology", weight: 65 }],
  });
  const result = computePortfolioRisks(portfolio, []);
  assert.ok(result);
  assert.equal(result.concentrationAlerts.length, 1);
  const alert = result.concentrationAlerts[0];
  assert.ok(alert);
  assert.equal(alert.name, "Technology");
});

void test("computePortfolioRisks suppresses position alerts when portfolio has single position", () => {
  const portfolio = makePortfolio({
    holdings: [
      {
        ticker: "MSFT",
        shares: 100,
        costBasis: 300,
        weight: 100,
        addedAt: "2026-01-01T00:00:00Z",
      },
    ],
    concentrationAlerts: [{ type: "position", name: "MSFT", weight: 100 }],
  });
  const result = computePortfolioRisks(portfolio, []);
  assert.ok(result);
  assert.equal(result.concentrationAlerts.length, 0);
});

void test("computePortfolioRisks keeps sector alerts even for single-position portfolio", () => {
  const portfolio = makePortfolio({
    holdings: [
      {
        ticker: "MSFT",
        shares: 100,
        costBasis: 300,
        weight: 100,
        addedAt: "2026-01-01T00:00:00Z",
      },
    ],
    concentrationAlerts: [
      { type: "position", name: "MSFT", weight: 100 },
      { type: "sector", name: "Technology", weight: 100 },
    ],
  });
  const result = computePortfolioRisks(portfolio, []);
  assert.ok(result);
  assert.equal(result.concentrationAlerts.length, 1);
  const alert = result.concentrationAlerts[0];
  assert.ok(alert);
  assert.equal(alert.type, "sector");
});

void test("computePortfolioRisks keeps position alerts when portfolio has multiple positions", () => {
  const portfolio = makePortfolio({
    concentrationAlerts: [{ type: "position", name: "AAPL", weight: 60 }],
  });
  const result = computePortfolioRisks(portfolio, []);
  assert.ok(result);
  assert.equal(result.concentrationAlerts.length, 1);
  const alert = result.concentrationAlerts[0];
  assert.ok(alert);
  assert.equal(alert.name, "AAPL");
});

void test("computePortfolioRisks returns totalPositions matching holdings count", () => {
  const portfolio = makePortfolio(); // has 2 holdings by default
  const result = computePortfolioRisks(portfolio, []);
  assert.ok(result);
  assert.equal(result.totalPositions, 2);
});

void test("computePortfolioRisks returns totalPositions 1 for single-position portfolio", () => {
  const portfolio = makePortfolio({
    holdings: [
      {
        ticker: "MSFT",
        shares: 100,
        costBasis: 300,
        weight: 100,
        addedAt: "2026-01-01T00:00:00Z",
      },
    ],
  });
  const result = computePortfolioRisks(portfolio, []);
  assert.ok(result);
  assert.equal(result.totalPositions, 1);
});
