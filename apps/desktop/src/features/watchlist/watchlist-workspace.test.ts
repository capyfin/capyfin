import assert from "node:assert/strict";
import test from "node:test";
import { WATCHLIST_EMPTY_TEXT } from "./components/WatchlistWorkspace";

void test("WATCHLIST_EMPTY_TEXT is a non-empty string", () => {
  assert.ok(typeof WATCHLIST_EMPTY_TEXT === "string");
  assert.ok(WATCHLIST_EMPTY_TEXT.length > 0);
});

void test("WatchlistWorkspace exports a function component", async () => {
  const mod = await import("./components/WatchlistWorkspace");
  assert.equal(typeof mod.WatchlistWorkspace, "function");
});
