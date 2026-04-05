import assert from "node:assert/strict";
import test from "node:test";
import { computeAttentionState } from "./attention.ts";
import type { InvestmentCase } from "@capyfin/contracts";

function makeCase(overrides: Partial<InvestmentCase> = {}): InvestmentCase {
  const now = new Date().toISOString();
  return {
    id: "test-id",
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
    monitoringEnabled: false,
    staleDays: 30,
    ...overrides,
  };
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

void test("recently reviewed case returns healthy", () => {
  const c = makeCase({ lastReviewedAt: new Date().toISOString() });
  assert.equal(computeAttentionState(c), "healthy");
});

void test("case not reviewed in 30+ days returns stale", () => {
  const c = makeCase({ lastReviewedAt: daysAgo(31), staleDays: 30 });
  assert.equal(computeAttentionState(c), "stale");
});

void test("case not reviewed in 45+ days (1.5x staleDays) returns review-now", () => {
  const c = makeCase({ lastReviewedAt: daysAgo(46), staleDays: 30 });
  assert.equal(computeAttentionState(c), "review-now");
});

void test("case with nextCatalystDate in 5 days returns catalyst-upcoming", () => {
  const c = makeCase({
    lastReviewedAt: new Date().toISOString(),
    nextCatalystDate: daysFromNow(5),
  });
  assert.equal(computeAttentionState(c), "catalyst-upcoming");
});

void test("case approaching staleDays threshold (75%+) returns review-soon", () => {
  const c = makeCase({ lastReviewedAt: daysAgo(23), staleDays: 30 });
  assert.equal(computeAttentionState(c), "review-soon");
});

void test("case with unresolved drift-detected history event returns drift-detected", () => {
  const c = makeCase({
    lastReviewedAt: new Date().toISOString(),
    history: [
      {
        id: "h1",
        date: daysAgo(2),
        eventType: "drift-detected",
        summary: "Thesis drift detected",
      },
    ],
  });
  assert.equal(computeAttentionState(c), "drift-detected");
});

void test("drift-detected resolved by subsequent refreshed event returns healthy", () => {
  const c = makeCase({
    lastReviewedAt: new Date().toISOString(),
    history: [
      {
        id: "h1",
        date: daysAgo(5),
        eventType: "drift-detected",
        summary: "Thesis drift detected",
      },
      {
        id: "h2",
        date: daysAgo(2),
        eventType: "refreshed",
        summary: "Case refreshed after drift review",
      },
    ],
  });
  assert.equal(computeAttentionState(c), "healthy");
});

void test("priority: review-now beats stale when both conditions met", () => {
  // 46 days is both >= 30 (stale) and >= 45 (review-now)
  const c = makeCase({ lastReviewedAt: daysAgo(46), staleDays: 30 });
  assert.equal(computeAttentionState(c), "review-now");
});

void test("priority: drift-detected beats stale", () => {
  const c = makeCase({
    lastReviewedAt: daysAgo(35),
    staleDays: 30,
    history: [
      {
        id: "h1",
        date: daysAgo(2),
        eventType: "drift-detected",
        summary: "Drift",
      },
    ],
  });
  // review-now: 35 < 45, so no. drift-detected is next priority, and stale also true.
  // priority: review-now > drift-detected > stale
  assert.equal(computeAttentionState(c), "drift-detected");
});

void test("custom staleDays threshold (14 days) is respected", () => {
  const c = makeCase({ lastReviewedAt: daysAgo(15), staleDays: 14 });
  assert.equal(computeAttentionState(c), "stale");
});
