import assert from "node:assert/strict";
import test from "node:test";
import { computeReviewScore, type ReviewScoreContext } from "./scoring.ts";

function ctx(overrides: Partial<ReviewScoreContext> = {}): ReviewScoreContext {
  return {
    isHolding: false,
    positionWeight: 0,
    daysUntilCatalyst: null,
    ...overrides,
  };
}

void test("review-now state scores highest", () => {
  const score = computeReviewScore("review-now", 45, ctx());
  // review-now = 100 attention + days weight + 0 holding + 0 position + 0 catalyst
  assert.ok(score >= 100, `expected score >= 100, got ${String(score)}`);
});

void test("a stale holding outranks a stale non-holding", () => {
  const holdingScore = computeReviewScore(
    "stale",
    35,
    ctx({ isHolding: true }),
  );
  const nonHoldingScore = computeReviewScore("stale", 35, ctx());
  assert.ok(
    holdingScore > nonHoldingScore,
    `holding ${String(holdingScore)} should outrank non-holding ${String(nonHoldingScore)}`,
  );
});

void test("larger position weight increases score", () => {
  const smallPos = computeReviewScore(
    "stale",
    35,
    ctx({ isHolding: true, positionWeight: 5 }),
  );
  const largePos = computeReviewScore(
    "stale",
    35,
    ctx({ isHolding: true, positionWeight: 20 }),
  );
  assert.ok(
    largePos > smallPos,
    `large position ${String(largePos)} should outrank small ${String(smallPos)}`,
  );
});

void test("closer catalyst proximity increases score", () => {
  const far = computeReviewScore(
    "catalyst-upcoming",
    10,
    ctx({ daysUntilCatalyst: 6 }),
  );
  const close = computeReviewScore(
    "catalyst-upcoming",
    10,
    ctx({ daysUntilCatalyst: 1 }),
  );
  assert.ok(
    close > far,
    `close catalyst ${String(close)} should outrank far ${String(far)}`,
  );
});

void test("longer days since review increases score within same attention tier", () => {
  const short = computeReviewScore("stale", 31, ctx());
  const long = computeReviewScore("stale", 60, ctx());
  assert.ok(
    long > short,
    `longer unreviewed ${String(long)} should outrank shorter ${String(short)}`,
  );
});

void test("review-now with 0% position weight outranks review-soon holding with 25% position weight", () => {
  const reviewNow = computeReviewScore("review-now", 0, ctx());
  const reviewSoonHolding = computeReviewScore(
    "review-soon",
    0,
    ctx({ isHolding: true, positionWeight: 25 }),
  );
  assert.ok(
    reviewNow > reviewSoonHolding,
    `review-now ${String(reviewNow)} should outrank review-soon holding ${String(reviewSoonHolding)}`,
  );
});

void test("catalyst proximity of 0 days gives max catalyst weight", () => {
  const todayCatalyst = computeReviewScore(
    "catalyst-upcoming",
    10,
    ctx({ daysUntilCatalyst: 0 }),
  );
  const noCatalyst = computeReviewScore(
    "catalyst-upcoming",
    10,
    ctx({ daysUntilCatalyst: null }),
  );
  assert.ok(
    todayCatalyst > noCatalyst,
    `today catalyst ${String(todayCatalyst)} should be higher than no catalyst ${String(noCatalyst)}`,
  );
});

void test("no catalyst (null) gives 0 catalyst weight", () => {
  const withCatalyst = computeReviewScore(
    "stale",
    35,
    ctx({ daysUntilCatalyst: 3 }),
  );
  const without = computeReviewScore(
    "stale",
    35,
    ctx({ daysUntilCatalyst: null }),
  );
  assert.ok(
    withCatalyst > without,
    `with catalyst ${String(withCatalyst)} should outrank without ${String(without)}`,
  );
});
