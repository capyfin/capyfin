import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readComponent(filename: string): string {
  return readFileSync(resolve(__dirname, "components", filename), "utf-8");
}

// ---------------------------------------------------------------------------
// AC1: All existing watchlist items show company names via static map fallback
// ---------------------------------------------------------------------------

void test("WatchlistTable imports lookupCompanyName from ticker-company-map", () => {
  const src = readComponent("WatchlistTable.tsx");

  assert.match(
    src,
    /import\s*\{[^}]*lookupCompanyName[^}]*\}\s*from\s*["']\.\.\/ticker-company-map["']/,
    "WatchlistTable must import lookupCompanyName from ticker-company-map",
  );
});

// ---------------------------------------------------------------------------
// AC2: Company name rendering uses three-level fallback chain
// ---------------------------------------------------------------------------

void test("WatchlistTable uses lookupCompanyName as render-time fallback", () => {
  const src = readComponent("WatchlistTable.tsx");

  // The rendering should call lookupCompanyName as a fallback
  assert.match(
    src,
    /lookupCompanyName\s*\(\s*item\.ticker\s*\)/,
    "WatchlistTable must call lookupCompanyName(item.ticker) as a fallback",
  );
});

void test("Fallback chain: item.companyName → caseMap → lookupCompanyName", () => {
  const src = readComponent("WatchlistTable.tsx");

  // All three sources should appear in the rendering path
  assert.match(src, /item\.companyName/, "Must check item.companyName first");
  assert.match(
    src,
    /caseMap\?\.get\(item\.ticker\.toUpperCase\(\)\)\?\.companyName/,
    "Must check caseMap as second fallback",
  );
  assert.match(
    src,
    /lookupCompanyName\(item\.ticker\)/,
    "Must use lookupCompanyName as third fallback",
  );
});

// ---------------------------------------------------------------------------
// AC3: Company name styling preserved
// ---------------------------------------------------------------------------

void test("Company name still uses text-[12px] text-muted-foreground/50 styling", () => {
  const src = readComponent("WatchlistTable.tsx");

  assert.match(
    src,
    /text-\[12px\][^"]*text-muted-foreground\/50/,
    "Company name must use text-[12px] and text-muted-foreground/50 styling",
  );
});

// ---------------------------------------------------------------------------
// AC4: Items with stored companyName still use that value (no regression)
// ---------------------------------------------------------------------------

void test("item.companyName is checked before lookupCompanyName", () => {
  const src = readComponent("WatchlistTable.tsx");

  // item.companyName should appear before lookupCompanyName in the nullish coalescing chain
  const itemIdx = src.indexOf("item.companyName");
  const lookupIdx = src.indexOf("lookupCompanyName(item.ticker)");

  assert.ok(itemIdx > -1, "item.companyName must exist in the source");
  assert.ok(lookupIdx > -1, "lookupCompanyName must exist in the source");
  assert.ok(
    itemIdx < lookupIdx,
    "item.companyName must be checked before lookupCompanyName (preserves stored values)",
  );
});

// ---------------------------------------------------------------------------
// AC5: No schema/dialog changes — render-only fix
// ---------------------------------------------------------------------------

void test("ticker-company-map.ts exports lookupCompanyName function", () => {
  const src = readFileSync(
    resolve(__dirname, "ticker-company-map.ts"),
    "utf-8",
  );

  assert.match(
    src,
    /export\s+function\s+lookupCompanyName/,
    "ticker-company-map.ts must export lookupCompanyName function",
  );
});

// ---------------------------------------------------------------------------
// AC6: Static map includes the 4 specific existing watchlist tickers
// ---------------------------------------------------------------------------

void test("Static map includes TSLA, GOOG, NET, AAPL", () => {
  const src = readFileSync(
    resolve(__dirname, "ticker-company-map.ts"),
    "utf-8",
  );

  assert.match(src, /TSLA/, "Map must include TSLA");
  assert.match(src, /GOOG/, "Map must include GOOG");
  assert.match(src, /NET/, "Map must include NET");
  assert.match(src, /AAPL/, "Map must include AAPL");
});
