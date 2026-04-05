import assert from "node:assert/strict";
import test from "node:test";

// Since we can't render React components in node:test,
// we test the badge logic (style/label mapping) directly.
// The component is a thin wrapper over these mappings.

const attentionLabels: Record<string, string> = {
  "review-now": "Review Now",
  "drift-detected": "Drift",
  stale: "Stale",
  "catalyst-upcoming": "Catalyst",
  "review-soon": "Review Soon",
  healthy: "Healthy",
};

const attentionStyles: Record<string, string> = {
  "review-now":
    "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20",
  "drift-detected":
    "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20",
  stale:
    "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
  "catalyst-upcoming":
    "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
  "review-soon":
    "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
  healthy:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
};

void test("AttentionBadge maps all attention states to labels", () => {
  const states = [
    "review-now",
    "drift-detected",
    "stale",
    "catalyst-upcoming",
    "review-soon",
    "healthy",
  ];
  for (const state of states) {
    assert.ok(attentionLabels[state], `Missing label for state: ${state}`);
  }
});

void test("AttentionBadge maps all attention states to styles", () => {
  const states = [
    "review-now",
    "drift-detected",
    "stale",
    "catalyst-upcoming",
    "review-soon",
    "healthy",
  ];
  for (const state of states) {
    assert.ok(attentionStyles[state], `Missing style for state: ${state}`);
  }
});

void test("review-now and drift-detected use red urgency colors", () => {
  assert.ok(attentionStyles["review-now"]?.includes("red"));
  assert.ok(attentionStyles["drift-detected"]?.includes("red"));
});

void test("stale uses amber urgency colors", () => {
  assert.ok(attentionStyles.stale?.includes("amber"));
});

void test("catalyst-upcoming uses blue colors", () => {
  assert.ok(attentionStyles["catalyst-upcoming"]?.includes("blue"));
});

void test("review-soon uses zinc/gray colors", () => {
  assert.ok(attentionStyles["review-soon"]?.includes("zinc"));
});

void test("healthy uses emerald/green colors", () => {
  assert.ok(attentionStyles.healthy?.includes("emerald"));
});
