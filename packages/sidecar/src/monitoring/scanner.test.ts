import assert from "node:assert/strict";
import test from "node:test";
import { scanCases } from "./scanner.ts";
import type { AttentionItem, InvestmentCase } from "@capyfin/contracts";

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
    attentionState: "healthy",
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

function first(items: AttentionItem[]): AttentionItem {
  const item = items[0];
  assert.ok(item, "expected at least one item");
  return item;
}

void test("healthy case generates no attention items", () => {
  const cases = [makeCase({ attentionState: "healthy" })];
  const result = scanCases(cases, []);
  assert.equal(result.length, 0);
});

void test("stale case generates item with medium urgency", () => {
  const cases = [
    makeCase({
      attentionState: "stale",
      lastReviewedAt: daysAgo(35),
    }),
  ];
  const result = scanCases(cases, []);
  assert.equal(result.length, 1);
  const item = first(result);
  assert.equal(item.urgency, "medium");
  assert.equal(item.attentionState, "stale");
  assert.ok(item.reason.includes("AAPL"));
  assert.equal(item.dismissed, false);
});

void test("review-now case generates item with high urgency", () => {
  const cases = [
    makeCase({
      attentionState: "review-now",
      lastReviewedAt: daysAgo(50),
    }),
  ];
  const result = scanCases(cases, []);
  assert.equal(result.length, 1);
  const item = first(result);
  assert.equal(item.urgency, "high");
  assert.equal(item.attentionState, "review-now");
});

void test("catalyst-upcoming generates item with catalyst description in reason", () => {
  const cases = [
    makeCase({
      attentionState: "catalyst-upcoming",
      nextCatalystDate: daysFromNow(3),
      nextCatalystDescription: "Q1 Earnings",
    }),
  ];
  const result = scanCases(cases, []);
  assert.equal(result.length, 1);
  const item = first(result);
  assert.equal(item.urgency, "medium");
  assert.ok(item.reason.includes("Q1 Earnings"));
});

void test("drift-detected generates item with high urgency", () => {
  const cases = [makeCase({ attentionState: "drift-detected" })];
  const result = scanCases(cases, []);
  assert.equal(result.length, 1);
  const item = first(result);
  assert.equal(item.urgency, "high");
});

void test("review-soon generates item with low urgency", () => {
  const cases = [
    makeCase({
      attentionState: "review-soon",
      lastReviewedAt: daysAgo(24),
    }),
  ];
  const result = scanCases(cases, []);
  assert.equal(result.length, 1);
  const item = first(result);
  assert.equal(item.urgency, "low");
});

void test("monitoringEnabled: false cases are skipped", () => {
  const cases = [
    makeCase({
      attentionState: "stale",
      monitoringEnabled: false,
      lastReviewedAt: daysAgo(35),
    }),
  ];
  const result = scanCases(cases, []);
  assert.equal(result.length, 0);
});

void test("deduplication: same case+state does not create duplicate", () => {
  const existingItem: AttentionItem = {
    id: "item-1",
    caseId: "case-1",
    ticker: "AAPL",
    companyName: "Apple Inc.",
    reason: "AAPL has not been reviewed in 35 days",
    urgency: "medium",
    attentionState: "stale",
    detectedAt: daysAgo(1),
    dismissed: false,
  };
  const cases = [
    makeCase({
      attentionState: "stale",
      lastReviewedAt: daysAgo(36),
    }),
  ];
  const result = scanCases(cases, [existingItem]);
  assert.equal(result.length, 1);
  const item = first(result);
  assert.equal(item.id, "item-1"); // kept original
});

void test("state transition: old state item removed when case transitions to new state", () => {
  const existingItem: AttentionItem = {
    id: "item-1",
    caseId: "case-1",
    ticker: "AAPL",
    companyName: "Apple Inc.",
    reason: "old reason",
    urgency: "low",
    attentionState: "review-soon",
    detectedAt: daysAgo(5),
    dismissed: false,
  };
  const cases = [
    makeCase({
      attentionState: "stale",
      lastReviewedAt: daysAgo(35),
    }),
  ];
  const result = scanCases(cases, [existingItem]);
  assert.equal(result.length, 1);
  const item = first(result);
  assert.equal(item.attentionState, "stale"); // new state
  assert.notEqual(item.id, "item-1"); // new item
});

void test("resolved condition: item removed when case becomes healthy", () => {
  const existingItem: AttentionItem = {
    id: "item-1",
    caseId: "case-1",
    ticker: "AAPL",
    companyName: "Apple Inc.",
    reason: "stale reason",
    urgency: "medium",
    attentionState: "stale",
    detectedAt: daysAgo(5),
    dismissed: false,
  };
  const cases = [makeCase({ attentionState: "healthy" })];
  const result = scanCases(cases, [existingItem]);
  assert.equal(result.length, 0);
});

void test("dismissed items cleaned up when condition resolves", () => {
  const existingItem: AttentionItem = {
    id: "item-1",
    caseId: "case-1",
    ticker: "AAPL",
    companyName: "Apple Inc.",
    reason: "stale reason",
    urgency: "medium",
    attentionState: "stale",
    detectedAt: daysAgo(5),
    dismissed: true,
  };
  const cases = [makeCase({ attentionState: "healthy" })];
  const result = scanCases(cases, [existingItem]);
  assert.equal(result.length, 0);
});

void test("dismissed items retained when condition still holds", () => {
  const existingItem: AttentionItem = {
    id: "item-1",
    caseId: "case-1",
    ticker: "AAPL",
    companyName: "Apple Inc.",
    reason: "stale reason",
    urgency: "medium",
    attentionState: "stale",
    detectedAt: daysAgo(5),
    dismissed: true,
  };
  const cases = [
    makeCase({
      attentionState: "stale",
      lastReviewedAt: daysAgo(35),
    }),
  ];
  const result = scanCases(cases, [existingItem]);
  assert.equal(result.length, 1);
  const item = first(result);
  assert.equal(item.id, "item-1");
  assert.equal(item.dismissed, true);
});

void test("multiple cases produce correct items", () => {
  const cases = [
    makeCase({
      id: "case-1",
      ticker: "AAPL",
      attentionState: "stale",
      lastReviewedAt: daysAgo(35),
    }),
    makeCase({
      id: "case-2",
      ticker: "NVDA",
      companyName: "NVIDIA Corp.",
      attentionState: "review-now",
      lastReviewedAt: daysAgo(50),
    }),
    makeCase({
      id: "case-3",
      ticker: "MSFT",
      companyName: "Microsoft Corp.",
      attentionState: "healthy",
    }),
  ];
  const result = scanCases(cases, []);
  assert.equal(result.length, 2);
  const tickers = result.map((i) => i.ticker).sort();
  assert.deepEqual(tickers, ["AAPL", "NVDA"]);
});
