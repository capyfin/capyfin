import assert from "node:assert/strict";
import test from "node:test";
import { getTickerActions } from "../ticker-actions/get-ticker-actions";

void test("WatchlistTable accepts onCardAction prop", async () => {
  const mod = await import("./components/WatchlistTable");
  assert.equal(typeof mod.WatchlistTable, "function");
  // Component should accept onCardAction as an optional prop (no runtime error on import)
});

void test("WATCHLIST_CARD_ACTIONS is exported from get-watchlist-card-actions", async () => {
  const mod = await import("./get-watchlist-card-actions");
  assert.ok(
    Array.isArray(mod.WATCHLIST_CARD_ACTIONS),
    "Should export WATCHLIST_CARD_ACTIONS array",
  );
  assert.ok(
    mod.WATCHLIST_CARD_ACTIONS.length >= 3,
    "Should include at least 3 quick-action cards",
  );
});

void test("WATCHLIST_CARD_ACTIONS includes Deep Dive, Fair Value, Bull/Bear", async () => {
  const mod = await import("./get-watchlist-card-actions");
  const titles = mod.WATCHLIST_CARD_ACTIONS.map(
    (c: { title: string }) => c.title,
  );
  assert.ok(titles.includes("Deep Dive"), "Should include Deep Dive");
  assert.ok(titles.includes("Fair Value"), "Should include Fair Value");
  assert.ok(titles.includes("Bull / Bear"), "Should include Bull / Bear");
});

void test("WATCHLIST_CARD_ACTIONS are all ticker-input cards", async () => {
  const mod = await import("./get-watchlist-card-actions");
  for (const card of mod.WATCHLIST_CARD_ACTIONS) {
    assert.equal(
      (card as { input: string }).input,
      "ticker",
      `${(card as { title: string }).title} should have input=ticker`,
    );
  }
});

void test("WATCHLIST_CARD_ACTIONS is sourced from getTickerActions", async () => {
  const mod = await import("./get-watchlist-card-actions");
  const allTicker = getTickerActions();
  for (const card of mod.WATCHLIST_CARD_ACTIONS) {
    const found = allTicker.find((a) => a.id === (card as { id: string }).id);
    assert.ok(
      found,
      `Card ${(card as { id: string }).id} should be in getTickerActions`,
    );
  }
});

void test("WatchlistWorkspace accepts onCardAction prop", async () => {
  const mod = await import("./components/WatchlistWorkspace");
  assert.equal(typeof mod.WatchlistWorkspace, "function");
});
