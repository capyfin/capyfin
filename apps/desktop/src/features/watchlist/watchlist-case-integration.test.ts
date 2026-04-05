import assert from "node:assert/strict";
import test from "node:test";
import type { InvestmentCase, WatchlistItem } from "@capyfin/contracts";
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

// Replicates the "needs-review" filter logic from WatchlistWorkspace
function filterNeedsReview(
  items: WatchlistItem[],
  caseMap: Map<string, InvestmentCase>,
): WatchlistItem[] {
  return items.filter((i) => {
    const status = getCaseStatus(i.ticker, caseMap);
    return !status.hasCase || status.isStale || status.isLowConfidence;
  });
}

// ---------------------------------------------------------------------------
// Needs Review filter
// ---------------------------------------------------------------------------

void test("Needs Review filter includes items without a case", () => {
  const items = [makeWatchlistItem({ ticker: "TSLA" })];
  const caseMap = buildCaseMap([]);
  const filtered = filterNeedsReview(items, caseMap);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.ticker, "TSLA");
});

void test("Needs Review filter includes items with stale case", () => {
  const now = new Date("2026-04-04T00:00:00Z");
  const items = [makeWatchlistItem({ ticker: "AAPL" })];
  const cases = [
    makeCase({
      ticker: "AAPL",
      lastReviewedAt: "2026-02-01T00:00:00Z",
    }),
  ];
  const caseMap = buildCaseMap(cases);
  // Manually check with now parameter
  const status = getCaseStatus("AAPL", caseMap, 30, now);
  assert.equal(status.isStale, true);
  const filtered = items.filter((i) => {
    const s = getCaseStatus(i.ticker, caseMap, 30, now);
    return !s.hasCase || s.isStale || s.isLowConfidence;
  });
  assert.equal(filtered.length, 1);
});

void test("Needs Review filter includes items with low confidence", () => {
  const items = [makeWatchlistItem({ ticker: "GOOG" })];
  const cases = [
    makeCase({
      ticker: "GOOG",
      confidence: "LOW",
      lastReviewedAt: "2026-04-01T00:00:00Z",
    }),
  ];
  const caseMap = buildCaseMap(cases);
  const now = new Date("2026-04-04T00:00:00Z");
  const filtered = items.filter((i) => {
    const s = getCaseStatus(i.ticker, caseMap, 30, now);
    return !s.hasCase || s.isStale || s.isLowConfidence;
  });
  assert.equal(filtered.length, 1);
});

void test("Needs Review filter excludes items with fresh high-confidence case", () => {
  const items = [makeWatchlistItem({ ticker: "MSFT" })];
  const cases = [
    makeCase({
      ticker: "MSFT",
      confidence: "HIGH",
      lastReviewedAt: "2026-04-01T00:00:00Z",
    }),
  ];
  const caseMap = buildCaseMap(cases);
  const now = new Date("2026-04-04T00:00:00Z");
  const filtered = items.filter((i) => {
    const s = getCaseStatus(i.ticker, caseMap, 30, now);
    return !s.hasCase || s.isStale || s.isLowConfidence;
  });
  assert.equal(filtered.length, 0);
});

void test("Needs Review filter handles mixed items correctly", () => {
  const items = [
    makeWatchlistItem({ ticker: "AAPL" }),
    makeWatchlistItem({ ticker: "TSLA" }),
    makeWatchlistItem({ ticker: "MSFT" }),
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
      confidence: "LOW",
      lastReviewedAt: "2026-04-01T00:00:00Z",
    }),
  ];
  const caseMap = buildCaseMap(cases);
  const now = new Date("2026-04-04T00:00:00Z");
  const filtered = items.filter((i) => {
    const s = getCaseStatus(i.ticker, caseMap, 30, now);
    return !s.hasCase || s.isStale || s.isLowConfidence;
  });
  // TSLA has no case, MSFT has low confidence → 2 results (AAPL excluded)
  assert.equal(filtered.length, 2);
  const tickers = filtered.map((i) => i.ticker);
  assert.ok(tickers.includes("TSLA"));
  assert.ok(tickers.includes("MSFT"));
});

// ---------------------------------------------------------------------------
// Valuation Interesting filter
// ---------------------------------------------------------------------------

function filterValuationInteresting(
  items: WatchlistItem[],
  caseMap: Map<string, InvestmentCase>,
): WatchlistItem[] {
  return items.filter((i) => {
    const status = getCaseStatus(i.ticker, caseMap);
    if (!status.hasCase) return false;
    const c = caseMap.get(i.ticker.toUpperCase());
    if (!c) return false;
    if (c.attentionState === "valuation-interesting") return true;
    if (
      c.tags.some(
        (t) =>
          t.toLowerCase() === "undervalued" ||
          t.toLowerCase() === "valuation-interesting",
      )
    )
      return true;
    if (c.sections.some((s) => s.title.toLowerCase().includes("valuation")))
      return true;
    return false;
  });
}

void test("Valuation Interesting filter includes items with valuation-interesting attention state", () => {
  const items = [makeWatchlistItem({ ticker: "AAPL" })];
  const cases = [
    makeCase({
      ticker: "AAPL",
      attentionState: "valuation-interesting",
    }),
  ];
  const caseMap = buildCaseMap(cases);
  const filtered = filterValuationInteresting(items, caseMap);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.ticker, "AAPL");
});

void test("Valuation Interesting filter includes items with undervalued tag", () => {
  const items = [makeWatchlistItem({ ticker: "GOOG" })];
  const cases = [
    makeCase({
      ticker: "GOOG",
      tags: ["undervalued", "tech"],
    }),
  ];
  const caseMap = buildCaseMap(cases);
  const filtered = filterValuationInteresting(items, caseMap);
  assert.equal(filtered.length, 1);
});

void test("Valuation Interesting filter includes items with valuation section", () => {
  const items = [makeWatchlistItem({ ticker: "MSFT" })];
  const cases = [
    makeCase({
      ticker: "MSFT",
      sections: [
        {
          id: "s1",
          title: "Valuation Analysis",
          content: "Fair value range...",
          confidence: "MEDIUM",
          citations: [],
        },
      ],
    }),
  ];
  const caseMap = buildCaseMap(cases);
  const filtered = filterValuationInteresting(items, caseMap);
  assert.equal(filtered.length, 1);
});

void test("Valuation Interesting filter excludes items without valuation signals", () => {
  const items = [makeWatchlistItem({ ticker: "TSLA" })];
  const cases = [
    makeCase({
      ticker: "TSLA",
      attentionState: "healthy",
      tags: ["tech"],
      sections: [
        {
          id: "s1",
          title: "Thesis",
          content: "...",
          confidence: "HIGH",
          citations: [],
        },
      ],
    }),
  ];
  const caseMap = buildCaseMap(cases);
  const filtered = filterValuationInteresting(items, caseMap);
  assert.equal(filtered.length, 0);
});

void test("Valuation Interesting filter excludes items without a case", () => {
  const items = [makeWatchlistItem({ ticker: "NVDA" })];
  const caseMap = buildCaseMap([]);
  const filtered = filterValuationInteresting(items, caseMap);
  assert.equal(filtered.length, 0);
});
