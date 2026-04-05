import assert from "node:assert/strict";
import test from "node:test";
import type { InvestmentCase } from "@capyfin/contracts";
import {
  CASES_FILTER_TABS,
  filterCases,
  getCasesFilterGuidance,
} from "./case-filters";

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

const EMPTY_SET = new Set<string>();

// ---------------------------------------------------------------------------
// CASES_FILTER_TABS
// ---------------------------------------------------------------------------

void test("CASES_FILTER_TABS includes all required categories", () => {
  const values = CASES_FILTER_TABS.map((t) => t.value);
  assert.ok(values.includes("all"));
  assert.ok(values.includes("holdings"));
  assert.ok(values.includes("watchlist"));
  assert.ok(values.includes("drift"));
  assert.ok(values.includes("stale"));
  assert.ok(values.includes("recent"));
});

void test("CASES_FILTER_TABS first item is All", () => {
  const first = CASES_FILTER_TABS[0];
  assert.ok(first);
  assert.equal(first.value, "all");
  assert.equal(first.label, "All");
});

// ---------------------------------------------------------------------------
// filterCases — all filter
// ---------------------------------------------------------------------------

void test("filterCases all returns all cases", () => {
  const cases = [makeCase({ id: "1" }), makeCase({ id: "2" })];
  const result = filterCases(cases, "all", EMPTY_SET, EMPTY_SET);
  assert.equal(result.length, 2);
});

void test("filterCases all returns empty array for no cases", () => {
  const result = filterCases([], "all", EMPTY_SET, EMPTY_SET);
  assert.equal(result.length, 0);
});

// ---------------------------------------------------------------------------
// filterCases — holdings filter
// ---------------------------------------------------------------------------

void test("filterCases holdings returns only cases matching portfolio tickers", () => {
  const cases = [
    makeCase({ id: "1", ticker: "AAPL" }),
    makeCase({ id: "2", ticker: "GOOG" }),
    makeCase({ id: "3", ticker: "MSFT" }),
  ];
  const holdings = new Set(["AAPL", "MSFT"]);
  const result = filterCases(cases, "holdings", holdings, EMPTY_SET);
  assert.equal(result.length, 2);
  assert.deepEqual(
    result.map((c) => c.ticker),
    ["AAPL", "MSFT"],
  );
});

void test("filterCases holdings is case-insensitive on ticker", () => {
  const cases = [makeCase({ id: "1", ticker: "aapl" })];
  const holdings = new Set(["AAPL"]);
  const result = filterCases(cases, "holdings", holdings, EMPTY_SET);
  assert.equal(result.length, 1);
});

void test("filterCases holdings returns empty when no tickers match", () => {
  const cases = [makeCase({ id: "1", ticker: "GOOG" })];
  const holdings = new Set(["AAPL"]);
  const result = filterCases(cases, "holdings", holdings, EMPTY_SET);
  assert.equal(result.length, 0);
});

// ---------------------------------------------------------------------------
// filterCases — watchlist filter
// ---------------------------------------------------------------------------

void test("filterCases watchlist returns only cases matching watchlist tickers", () => {
  const cases = [
    makeCase({ id: "1", ticker: "AAPL" }),
    makeCase({ id: "2", ticker: "GOOG" }),
  ];
  const watchlist = new Set(["GOOG"]);
  const result = filterCases(cases, "watchlist", EMPTY_SET, watchlist);
  assert.equal(result.length, 1);
  assert.ok(result[0]);
  assert.equal(result[0].ticker, "GOOG");
});

// ---------------------------------------------------------------------------
// filterCases — active filter
// ---------------------------------------------------------------------------

void test("filterCases active returns healthy cases", () => {
  const cases = [
    makeCase({ id: "1", attentionState: "healthy" }),
    makeCase({ id: "2", attentionState: "stale" }),
    makeCase({ id: "3", attentionState: undefined }),
  ];
  const result = filterCases(cases, "active", EMPTY_SET, EMPTY_SET);
  assert.equal(result.length, 2);
  assert.deepEqual(
    result.map((c) => c.id),
    ["1", "3"],
  );
});

// ---------------------------------------------------------------------------
// filterCases — drift filter
// ---------------------------------------------------------------------------

void test("filterCases drift returns only drift-detected cases", () => {
  const cases = [
    makeCase({ id: "1", attentionState: "drift-detected" }),
    makeCase({ id: "2", attentionState: "healthy" }),
    makeCase({ id: "3", attentionState: "drift-detected" }),
  ];
  const result = filterCases(cases, "drift", EMPTY_SET, EMPTY_SET);
  assert.equal(result.length, 2);
  assert.deepEqual(
    result.map((c) => c.id),
    ["1", "3"],
  );
});

void test("filterCases drift returns empty when no drift cases", () => {
  const cases = [
    makeCase({ id: "1", attentionState: "healthy" }),
    makeCase({ id: "2", attentionState: "stale" }),
  ];
  const result = filterCases(cases, "drift", EMPTY_SET, EMPTY_SET);
  assert.equal(result.length, 0);
});

// ---------------------------------------------------------------------------
// filterCases — stale filter
// ---------------------------------------------------------------------------

void test("filterCases stale returns stale and review-now cases", () => {
  const cases = [
    makeCase({ id: "1", attentionState: "stale" }),
    makeCase({ id: "2", attentionState: "review-now" }),
    makeCase({ id: "3", attentionState: "healthy" }),
    makeCase({ id: "4", attentionState: "review-soon" }),
  ];
  const result = filterCases(cases, "stale", EMPTY_SET, EMPTY_SET);
  assert.equal(result.length, 2);
  assert.deepEqual(
    result.map((c) => c.id),
    ["1", "2"],
  );
});

// ---------------------------------------------------------------------------
// filterCases — recent filter
// ---------------------------------------------------------------------------

void test("filterCases recent returns cases updated in last 7 days", () => {
  const now = new Date();
  const threeDaysAgo = new Date(
    now.getTime() - 3 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const tenDaysAgo = new Date(
    now.getTime() - 10 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const cases = [
    makeCase({ id: "1", updatedAt: threeDaysAgo }),
    makeCase({ id: "2", updatedAt: tenDaysAgo }),
  ];
  const result = filterCases(cases, "recent", EMPTY_SET, EMPTY_SET);
  assert.equal(result.length, 1);
  assert.ok(result[0]);
  assert.equal(result[0].id, "1");
});

void test("filterCases recent returns cases updated exactly 7 days ago", () => {
  const now = new Date();
  const sevenDaysAgo = new Date(
    now.getTime() - 7 * 24 * 60 * 60 * 1000 + 1000,
  ).toISOString();
  const cases = [makeCase({ id: "1", updatedAt: sevenDaysAgo })];
  const result = filterCases(cases, "recent", EMPTY_SET, EMPTY_SET);
  assert.equal(result.length, 1);
});

// ---------------------------------------------------------------------------
// getCasesFilterGuidance
// ---------------------------------------------------------------------------

void test("getCasesFilterGuidance returns null for all filter", () => {
  assert.equal(getCasesFilterGuidance("all", 0, 5), null);
});

void test("getCasesFilterGuidance returns null when filtered results exist", () => {
  assert.equal(getCasesFilterGuidance("holdings", 3, 5), null);
});

void test("getCasesFilterGuidance returns null when total is zero", () => {
  assert.equal(getCasesFilterGuidance("holdings", 0, 0), null);
});

void test("getCasesFilterGuidance returns message for empty holdings filter", () => {
  const result = getCasesFilterGuidance("holdings", 0, 5);
  assert.ok(result !== null);
  assert.ok(result.includes("holdings"));
});

void test("getCasesFilterGuidance returns message for each filter", () => {
  const filters = [
    "holdings",
    "watchlist",
    "active",
    "drift",
    "stale",
    "recent",
    "archived",
  ] as const;
  for (const f of filters) {
    const result = getCasesFilterGuidance(f, 0, 5);
    assert.ok(result !== null, `Expected guidance for filter "${f}"`);
    assert.ok(
      result.length > 0,
      `Expected non-empty guidance for filter "${f}"`,
    );
  }
});
