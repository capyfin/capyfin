import assert from "node:assert/strict";
import test from "node:test";
import type { InvestmentCase } from "@capyfin/contracts";
import { buildChangeSummary } from "./history-summary.ts";

function stubCase(overrides: Partial<InvestmentCase> = {}): InvestmentCase {
  return {
    id: "case-1",
    ticker: "AAPL",
    companyName: "Apple Inc.",
    stance: "watching",
    confidence: "MEDIUM",
    lastReviewedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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

void test("buildChangeSummary: detects stance change", () => {
  const prior = stubCase({ stance: "neutral" });
  const updated = stubCase({ stance: "bullish" });
  const summary = buildChangeSummary(prior, updated, "position-review");
  assert.ok(summary.includes("Stance changed from neutral to bullish"));
});

void test("buildChangeSummary: detects confidence change", () => {
  const prior = stubCase({ confidence: "LOW" });
  const updated = stubCase({ confidence: "HIGH" });
  const summary = buildChangeSummary(prior, updated, "deep-dive");
  assert.ok(summary.includes("Confidence changed from LOW to HIGH"));
});

void test("buildChangeSummary: includes both stance and confidence change", () => {
  const prior = stubCase({ stance: "neutral", confidence: "LOW" });
  const updated = stubCase({ stance: "bearish", confidence: "HIGH" });
  const summary = buildChangeSummary(prior, updated, "position-review");
  assert.ok(summary.includes("Stance changed from neutral to bearish"));
  assert.ok(summary.includes("Confidence changed from LOW to HIGH"));
});

void test("buildChangeSummary: includes workflow context", () => {
  const prior = stubCase({ stance: "neutral" });
  const updated = stubCase({ stance: "bullish" });
  const summary = buildChangeSummary(prior, updated, "position-review");
  assert.ok(summary.includes("after position review"));
});

void test("buildChangeSummary: earnings-xray workflow context", () => {
  const prior = stubCase({ stance: "neutral" });
  const updated = stubCase({ stance: "bullish" });
  const summary = buildChangeSummary(prior, updated, "earnings-xray");
  assert.ok(summary.includes("after earnings review"));
});

void test("buildChangeSummary: no meaningful changes fallback", () => {
  const prior = stubCase({ stance: "bullish", confidence: "HIGH" });
  const updated = stubCase({ stance: "bullish", confidence: "HIGH" });
  const summary = buildChangeSummary(prior, updated, "deep-dive");
  assert.ok(summary.includes("Case updated via deep-dive"));
});
