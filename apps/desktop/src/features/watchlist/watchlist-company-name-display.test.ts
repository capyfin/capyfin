import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readComponent(filename: string): string {
  return readFileSync(resolve(__dirname, "components", filename), "utf-8");
}

function readContracts(): string {
  return readFileSync(
    resolve(__dirname, "../../../../packages/contracts/src/index.ts"),
    "utf-8",
  );
}

// ---------------------------------------------------------------------------
// AC1: Watchlist ticker cells show company name alongside ticker for all items
// ---------------------------------------------------------------------------

void test("WatchlistTable renders item.companyName next to the ticker", () => {
  const src = readComponent("WatchlistTable.tsx");

  // The table should reference item.companyName for display
  assert.match(
    src,
    /item\.companyName/,
    "WatchlistTable must reference item.companyName for company name display",
  );
});

// ---------------------------------------------------------------------------
// AC2: Company names display even when no investment case exists
// ---------------------------------------------------------------------------

void test("Company name display does not require caseMap to be present", () => {
  const src = readComponent("WatchlistTable.tsx");

  // item.companyName should be used as the primary source (not solely relying on caseMap)
  // The rendering should show company name from item.companyName independently of caseMap
  const companyNameRender = /item\.companyName/.exec(src);
  assert.ok(
    companyNameRender,
    "Company name must be sourced from item.companyName, not solely from caseMap",
  );
});

// ---------------------------------------------------------------------------
// AC3: Company name uses smaller/muted text below or beside the ticker
// ---------------------------------------------------------------------------

void test("Company name uses smaller muted text styling", () => {
  const src = readComponent("WatchlistTable.tsx");

  // Company name should use small text with muted foreground color
  assert.match(
    src,
    /text-\[12px\][^"]*text-muted-foreground/,
    "Company name must use text-[12px] and muted foreground styling",
  );
});

// ---------------------------------------------------------------------------
// AC4: watchlistItemSchema includes companyName field
// ---------------------------------------------------------------------------

void test("watchlistItemSchema includes optional companyName field", () => {
  const src = readContracts();

  // The watchlistItemSchema should have a companyName field
  assert.match(
    src,
    /watchlistItemSchema[\s\S]{0,500}companyName/,
    "watchlistItemSchema must include a companyName field",
  );
});

// ---------------------------------------------------------------------------
// AC5: addWatchlistItemRequestSchema includes companyName field
// ---------------------------------------------------------------------------

void test("addWatchlistItemRequestSchema includes optional companyName field", () => {
  const src = readContracts();

  // The addWatchlistItemRequestSchema should have a companyName field
  assert.match(
    src,
    /addWatchlistItemRequestSchema[\s\S]{0,500}companyName/,
    "addWatchlistItemRequestSchema must include a companyName field",
  );
});

// ---------------------------------------------------------------------------
// AC6: A ticker-to-company-name lookup map exists
// ---------------------------------------------------------------------------

void test("A ticker-to-company-name lookup utility exists", () => {
  const src = readFileSync(
    resolve(__dirname, "ticker-company-map.ts"),
    "utf-8",
  );

  // Should export a lookup function or map
  assert.match(
    src,
    /export/,
    "ticker-company-map.ts must export a lookup utility",
  );

  // Should contain common tickers
  assert.match(src, /AAPL/, "Lookup map must include common tickers like AAPL");
  assert.match(src, /TSLA/, "Lookup map must include common tickers like TSLA");
  assert.match(src, /GOOG/, "Lookup map must include common tickers like GOOG");
});

// ---------------------------------------------------------------------------
// AC7: WatchlistItemDialog references companyName
// ---------------------------------------------------------------------------

void test("WatchlistItemDialog handles companyName when adding/editing items", () => {
  const src = readComponent("WatchlistItemDialog.tsx");

  assert.match(
    src,
    /companyName/,
    "WatchlistItemDialog must handle companyName field",
  );
});

// ---------------------------------------------------------------------------
// AC8: No regressions - WatchlistTable still renders core elements
// ---------------------------------------------------------------------------

void test("WatchlistTable still renders ticker, list badge, note, tags, and date", () => {
  const src = readComponent("WatchlistTable.tsx");

  assert.match(src, /item\.ticker/, "Must still render ticker");
  assert.match(src, /item\.list/, "Must still render list type");
  assert.match(src, /item\.note/, "Must still render note");
  assert.match(src, /item\.tags/, "Must still render tags");
  assert.match(src, /formatDate/, "Must still render date");
});
