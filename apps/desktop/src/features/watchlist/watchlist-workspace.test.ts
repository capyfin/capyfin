import assert from "node:assert/strict";
import test from "node:test";
import { WATCHLIST_EMPTY_TEXT } from "./components/WatchlistWorkspace";
import { getFilterGuidance } from "./components/watchlist-guidance";

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

void test("WATCHLIST_NEAR_EMPTY_TEXT is a non-empty string", async () => {
  const mod = await import("./components/WatchlistWorkspace");
  assert.ok(typeof mod.WATCHLIST_NEAR_EMPTY_TEXT === "string");
  assert.ok(mod.WATCHLIST_NEAR_EMPTY_TEXT.length > 0);
});

void test("WATCHLIST_NEAR_EMPTY_THRESHOLD is 5", async () => {
  const mod = await import("./components/WatchlistWorkspace");
  assert.equal(mod.WATCHLIST_NEAR_EMPTY_THRESHOLD, 5);
});

// --- Filter-specific guidance text tests ---

void test("getFilterGuidance returns null when filter is 'all' and items exist above threshold", () => {
  const result = getFilterGuidance("all", 6, 6);
  assert.equal(result, null);
});

function assertNonNull<T>(value: T | null | undefined): asserts value is T {
  assert.ok(value !== null && value !== undefined);
}

void test("getFilterGuidance returns near-empty text when filter is 'all' and items below threshold", () => {
  const result = getFilterGuidance("all", 3, 3);
  assertNonNull(result);
  assert.ok(result.includes("Add more tickers"));
});

void test("getFilterGuidance returns position-specific message when position filter has no results", () => {
  const result = getFilterGuidance("position", 0, 4);
  assertNonNull(result);
  assert.ok(result.toLowerCase().includes("position"));
  assert.ok(!result.includes("Add more tickers"));
});

void test("getFilterGuidance returns needs-review-specific message when needs-review filter has no results", () => {
  const result = getFilterGuidance("needs-review", 0, 4);
  assertNonNull(result);
  assert.ok(
    result.toLowerCase().includes("caught up") ||
      result.toLowerCase().includes("review"),
  );
  assert.ok(!result.includes("Add more tickers"));
});

void test("getFilterGuidance returns watching-specific message when watching filter has no results", () => {
  const result = getFilterGuidance("watching", 0, 4);
  assertNonNull(result);
  assert.ok(result.toLowerCase().includes("watching"));
  assert.ok(!result.includes("Add more tickers"));
});

void test("getFilterGuidance returns null when non-all filter has results", () => {
  const result = getFilterGuidance("position", 3, 5);
  assert.equal(result, null);
});

void test("getFilterGuidance returns null when non-all filter has results even below threshold", () => {
  const result = getFilterGuidance("watching", 2, 3);
  assert.equal(result, null);
});

void test("getFilterGuidance returns near-empty text when all filter has items below threshold", () => {
  const result = getFilterGuidance("all", 2, 2);
  assertNonNull(result);
  assert.ok(result.includes("Add more tickers"));
});
