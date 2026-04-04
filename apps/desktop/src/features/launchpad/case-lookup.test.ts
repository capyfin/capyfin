import assert from "node:assert/strict";
import test from "node:test";
import type { InvestmentCase } from "@capyfin/contracts";
import { buildCaseMap, getCaseStatus } from "./case-lookup";

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
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// buildCaseMap
// ---------------------------------------------------------------------------

void test("buildCaseMap returns empty map for empty array", () => {
  const map = buildCaseMap([]);
  assert.equal(map.size, 0);
});

void test("buildCaseMap creates map from single case", () => {
  const cases = [makeCase({ ticker: "AAPL" })];
  const map = buildCaseMap(cases);
  assert.equal(map.size, 1);
  assert.ok(map.has("AAPL"));
});

void test("buildCaseMap maps multiple different tickers", () => {
  const cases = [
    makeCase({ id: "c1", ticker: "AAPL" }),
    makeCase({ id: "c2", ticker: "MSFT" }),
    makeCase({ id: "c3", ticker: "GOOG" }),
  ];
  const map = buildCaseMap(cases);
  assert.equal(map.size, 3);
  assert.ok(map.has("AAPL"));
  assert.ok(map.has("MSFT"));
  assert.ok(map.has("GOOG"));
});

void test("buildCaseMap uses case-insensitive keys (uppercased)", () => {
  const cases = [makeCase({ ticker: "aapl" })];
  const map = buildCaseMap(cases);
  assert.ok(map.has("AAPL"));
  assert.ok(!map.has("aapl"));
});

void test("buildCaseMap picks most recently reviewed case for duplicate tickers", () => {
  const cases = [
    makeCase({
      id: "old",
      ticker: "AAPL",
      lastReviewedAt: "2026-01-01T00:00:00Z",
    }),
    makeCase({
      id: "new",
      ticker: "AAPL",
      lastReviewedAt: "2026-03-15T00:00:00Z",
    }),
  ];
  const map = buildCaseMap(cases);
  assert.equal(map.size, 1);
  const entry = map.get("AAPL");
  assert.ok(entry);
  assert.equal(entry.id, "new");
});

// ---------------------------------------------------------------------------
// getCaseStatus
// ---------------------------------------------------------------------------

void test("getCaseStatus returns hasCase false for unknown ticker", () => {
  const map = buildCaseMap([]);
  const status = getCaseStatus("TSLA", map);
  assert.equal(status.hasCase, false);
  assert.equal(status.isStale, false);
  assert.equal(status.isLowConfidence, false);
  assert.equal(status.caseId, undefined);
});

void test("getCaseStatus returns full status for known ticker", () => {
  const cases = [
    makeCase({
      id: "c1",
      ticker: "AAPL",
      stance: "bullish",
      confidence: "HIGH",
      lastReviewedAt: "2026-04-01T00:00:00Z",
    }),
  ];
  const map = buildCaseMap(cases);
  const now = new Date("2026-04-04T00:00:00Z");
  const status = getCaseStatus("AAPL", map, 30, now);
  assert.equal(status.hasCase, true);
  assert.equal(status.caseId, "c1");
  assert.equal(status.stance, "bullish");
  assert.equal(status.confidence, "HIGH");
  assert.equal(status.daysSinceReview, 3);
  assert.equal(status.isStale, false);
  assert.equal(status.isLowConfidence, false);
});

void test("getCaseStatus detects stale case (>30 days)", () => {
  const cases = [
    makeCase({
      id: "c1",
      ticker: "MSFT",
      lastReviewedAt: "2026-02-01T00:00:00Z",
    }),
  ];
  const map = buildCaseMap(cases);
  const now = new Date("2026-04-04T00:00:00Z");
  const status = getCaseStatus("MSFT", map, 30, now);
  assert.equal(status.isStale, true);
  assert.ok((status.daysSinceReview ?? 0) >= 30);
});

void test("getCaseStatus detects low confidence", () => {
  const cases = [
    makeCase({
      id: "c1",
      ticker: "GOOG",
      confidence: "LOW",
      lastReviewedAt: "2026-04-01T00:00:00Z",
    }),
  ];
  const map = buildCaseMap(cases);
  const now = new Date("2026-04-04T00:00:00Z");
  const status = getCaseStatus("GOOG", map, 30, now);
  assert.equal(status.isLowConfidence, true);
});

void test("getCaseStatus is case-insensitive on ticker lookup", () => {
  const cases = [makeCase({ id: "c1", ticker: "AAPL" })];
  const map = buildCaseMap(cases);
  const status = getCaseStatus("aapl", map);
  assert.equal(status.hasCase, true);
  assert.equal(status.caseId, "c1");
});
