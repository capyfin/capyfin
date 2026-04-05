import assert from "node:assert/strict";
import test from "node:test";

// We test the QuickCreate card selection logic by importing the same data
// the component uses and verifying the expected cards appear.
import { allCards } from "@/features/launchpad/card-registry";

const QUICK_CREATE_IDS = [
  "deep-dive",
  "morning-brief",
  "add-to-watchlist",
  "compare-companies",
  "fair-value",
];

const quickCards = allCards.filter((c) => QUICK_CREATE_IDS.includes(c.id));

// ---------------------------------------------------------------------------
// QuickCreate card selection
// ---------------------------------------------------------------------------

void test("QuickCreate includes all expected card IDs", () => {
  const ids = quickCards.map((c) => c.id);
  assert.ok(ids.includes("deep-dive"), "Missing deep-dive");
  assert.ok(ids.includes("morning-brief"), "Missing morning-brief");
  assert.ok(ids.includes("add-to-watchlist"), "Missing add-to-watchlist");
  assert.ok(ids.includes("compare-companies"), "Missing compare-companies");
  assert.ok(ids.includes("fair-value"), "Missing fair-value");
});

void test("QuickCreate resolves 5 cards", () => {
  assert.equal(quickCards.length, 5);
});

void test("Add to Watchlist card has ticker input", () => {
  const card = quickCards.find((c) => c.id === "add-to-watchlist");
  assert.ok(card, "add-to-watchlist not found in quick cards");
  assert.equal(card.input, "ticker");
});

void test("Compare Companies card has tickers input", () => {
  const card = quickCards.find((c) => c.id === "compare-companies");
  assert.ok(card, "compare-companies not found in quick cards");
  assert.equal(card.input, "tickers");
});

void test("existing Quick Create cards still present after additions", () => {
  const deepDive = quickCards.find((c) => c.id === "deep-dive");
  assert.ok(deepDive, "deep-dive must remain in Quick Create");
  const morningBrief = quickCards.find((c) => c.id === "morning-brief");
  assert.ok(morningBrief, "morning-brief must remain in Quick Create");
});
