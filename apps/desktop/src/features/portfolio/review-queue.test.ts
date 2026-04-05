import assert from "node:assert/strict";
import test from "node:test";
import type { InvestmentCase, PortfolioHolding } from "@capyfin/contracts";
import { buildCaseMap, getCaseStatus } from "../launchpad/case-lookup";

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

function makeHolding(
  overrides: Partial<PortfolioHolding> = {},
): PortfolioHolding {
  return {
    ticker: "AAPL",
    name: "Apple Inc.",
    shares: 100,
    costBasis: 150,
    currentPrice: 170,
    weight: 10,
    addedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

interface ReviewItem {
  ticker: string;
  reason: "missing" | "stale" | "low-confidence";
  daysSinceReview?: number | undefined;
}

// Replicates the ReviewQueue computation logic
function computeReviewItems(
  holdings: PortfolioHolding[],
  caseMap: Map<string, InvestmentCase>,
  now = new Date(),
): ReviewItem[] {
  const items: ReviewItem[] = [];
  for (const h of holdings) {
    const status = getCaseStatus(h.ticker, caseMap, 30, now);
    if (!status.hasCase) {
      items.push({ ticker: h.ticker, reason: "missing" });
    } else if (status.isStale) {
      items.push({
        ticker: h.ticker,
        reason: "stale",
        daysSinceReview: status.daysSinceReview,
      });
    } else if (status.isLowConfidence) {
      items.push({ ticker: h.ticker, reason: "low-confidence" });
    }
  }
  // Sort: missing first, then stale (most stale first), then low confidence
  items.sort((a, b) => {
    const order = { missing: 0, stale: 1, "low-confidence": 2 };
    if (order[a.reason] !== order[b.reason]) {
      return order[a.reason] - order[b.reason];
    }
    if (a.reason === "stale" && b.reason === "stale") {
      return (b.daysSinceReview ?? 0) - (a.daysSinceReview ?? 0);
    }
    return 0;
  });
  return items;
}

// ---------------------------------------------------------------------------
// ReviewQueue component exports
// ---------------------------------------------------------------------------

void test("ReviewQueue exports a function component", async () => {
  const mod = await import("./components/ReviewQueue");
  assert.equal(typeof mod.ReviewQueue, "function");
});

// ---------------------------------------------------------------------------
// ReviewQueue computation logic
// ---------------------------------------------------------------------------

void test("review queue is empty when all holdings have fresh high-confidence cases", () => {
  const holdings = [
    makeHolding({ ticker: "AAPL" }),
    makeHolding({ ticker: "MSFT" }),
  ];
  const cases = [
    makeCase({
      id: "c1",
      ticker: "AAPL",
      confidence: "HIGH",
      lastReviewedAt: "2026-04-01T00:00:00Z",
    }),
    makeCase({
      id: "c2",
      ticker: "MSFT",
      confidence: "HIGH",
      lastReviewedAt: "2026-04-01T00:00:00Z",
    }),
  ];
  const caseMap = buildCaseMap(cases);
  const now = new Date("2026-04-04T00:00:00Z");
  const items = computeReviewItems(holdings, caseMap, now);
  assert.equal(items.length, 0);
});

void test("review queue includes holdings without cases as 'missing'", () => {
  const holdings = [makeHolding({ ticker: "TSLA" })];
  const caseMap = buildCaseMap([]);
  const items = computeReviewItems(holdings, caseMap);
  assert.equal(items.length, 1);
  assert.equal(items[0]?.reason, "missing");
});

void test("review queue includes holdings with stale cases", () => {
  const holdings = [makeHolding({ ticker: "AAPL" })];
  const cases = [
    makeCase({
      ticker: "AAPL",
      lastReviewedAt: "2026-02-01T00:00:00Z",
    }),
  ];
  const caseMap = buildCaseMap(cases);
  const now = new Date("2026-04-04T00:00:00Z");
  const items = computeReviewItems(holdings, caseMap, now);
  assert.equal(items.length, 1);
  assert.equal(items[0]?.reason, "stale");
});

void test("review queue includes holdings with low confidence", () => {
  const holdings = [makeHolding({ ticker: "GOOG" })];
  const cases = [
    makeCase({
      ticker: "GOOG",
      confidence: "LOW",
      lastReviewedAt: "2026-04-01T00:00:00Z",
    }),
  ];
  const caseMap = buildCaseMap(cases);
  const now = new Date("2026-04-04T00:00:00Z");
  const items = computeReviewItems(holdings, caseMap, now);
  assert.equal(items.length, 1);
  assert.equal(items[0]?.reason, "low-confidence");
});

void test("review queue sorts: missing first, then stale by staleness desc, then low confidence", () => {
  const holdings = [
    makeHolding({ ticker: "GOOG" }),
    makeHolding({ ticker: "TSLA" }),
    makeHolding({ ticker: "AAPL" }),
    makeHolding({ ticker: "MSFT" }),
  ];
  const cases = [
    makeCase({
      id: "c1",
      ticker: "GOOG",
      confidence: "LOW",
      lastReviewedAt: "2026-04-01T00:00:00Z",
    }),
    makeCase({
      id: "c2",
      ticker: "AAPL",
      lastReviewedAt: "2026-01-01T00:00:00Z", // very stale
    }),
    makeCase({
      id: "c3",
      ticker: "MSFT",
      lastReviewedAt: "2026-02-15T00:00:00Z", // moderately stale
    }),
  ];
  const caseMap = buildCaseMap(cases);
  const now = new Date("2026-04-04T00:00:00Z");
  const items = computeReviewItems(holdings, caseMap, now);
  assert.equal(items.length, 4);
  const [first, second, third, fourth] = items;
  // TSLA missing → first
  assert.ok(first);
  assert.equal(first.ticker, "TSLA");
  assert.equal(first.reason, "missing");
  // AAPL more stale than MSFT → second
  assert.ok(second);
  assert.equal(second.ticker, "AAPL");
  assert.equal(second.reason, "stale");
  // MSFT stale → third
  assert.ok(third);
  assert.equal(third.ticker, "MSFT");
  assert.equal(third.reason, "stale");
  // GOOG low confidence → last
  assert.ok(fourth);
  assert.equal(fourth.ticker, "GOOG");
  assert.equal(fourth.reason, "low-confidence");
});
