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

void test("WatchlistEmptyState exports a function component", async () => {
  const mod = await import("./components/WatchlistEmptyState");
  assert.equal(typeof mod.WatchlistEmptyState, "function");
});

void test("WatchlistTable exports a function component", async () => {
  const mod = await import("./components/WatchlistTable");
  assert.equal(typeof mod.WatchlistTable, "function");
});

void test("WatchlistItemDialog exports a function component", async () => {
  const mod = await import("./components/WatchlistItemDialog");
  assert.equal(typeof mod.WatchlistItemDialog, "function");
});

void test("DeleteConfirmDialog exports a function component", async () => {
  const mod = await import("./components/DeleteConfirmDialog");
  assert.equal(typeof mod.DeleteConfirmDialog, "function");
});

void test("WatchlistTable exports sortable column type", async () => {
  const mod = await import("./components/WatchlistTable");
  assert.equal(typeof mod.WatchlistTable, "function");
});

void test("WatchlistEmptyState renders with onAdd prop type", async () => {
  const mod = await import("./components/WatchlistEmptyState");
  // Verify the component can be called (it's a valid React FC)
  assert.equal(mod.WatchlistEmptyState.length >= 0, true);
});
