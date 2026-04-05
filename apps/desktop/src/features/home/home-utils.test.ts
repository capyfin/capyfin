import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAttentionBullets,
  buildRecentUpdates,
  buildUpcomingCatalysts,
} from "./home-utils";
import type { AttentionItem, InvestmentCase } from "@capyfin/contracts";

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
