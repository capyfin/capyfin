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
// AC1: HoldingsTable imports lookupCompanyName from ticker-company-map
// ---------------------------------------------------------------------------

void test("HoldingsTable imports lookupCompanyName from ticker-company-map", () => {
  const src = readComponent("HoldingsTable.tsx");

  assert.match(
    src,
    /import\s*\{[^}]*lookupCompanyName[^}]*\}\s*from\s*["']@\/features\/watchlist\/ticker-company-map["']/,
    "HoldingsTable must import lookupCompanyName from @/features/watchlist/ticker-company-map",
  );
});

// ---------------------------------------------------------------------------
// AC2: HoldingsTable uses lookupCompanyName as render-time fallback
// ---------------------------------------------------------------------------

void test("HoldingsTable uses lookupCompanyName as render-time fallback", () => {
  const src = readComponent("HoldingsTable.tsx");

  assert.match(
    src,
    /lookupCompanyName\s*\(\s*holding\.ticker\s*\)/,
    "HoldingsTable must call lookupCompanyName(holding.ticker) as a fallback",
  );
});

// ---------------------------------------------------------------------------
// AC3: holding.name is checked before lookupCompanyName (no regression)
// ---------------------------------------------------------------------------

void test("holding.name is checked before lookupCompanyName", () => {
  const src = readComponent("HoldingsTable.tsx");

  const holdingNameIdx = src.indexOf("holding.name");
  const lookupIdx = src.indexOf("lookupCompanyName(holding.ticker)");

  assert.ok(holdingNameIdx > -1, "holding.name must exist in the source");
  assert.ok(lookupIdx > -1, "lookupCompanyName must exist in the source");
  assert.ok(
    holdingNameIdx < lookupIdx,
    "holding.name must be checked before lookupCompanyName (preserves stored values)",
  );
});

// ---------------------------------------------------------------------------
// AC4: Company name uses muted styling (small text below ticker)
// ---------------------------------------------------------------------------

void test("Company name uses text-xs text-muted-foreground styling", () => {
  const src = readComponent("HoldingsTable.tsx");

  assert.match(
    src,
    /text-xs[^"]*text-muted-foreground/,
    "Company name must use text-xs and text-muted-foreground styling",
  );
});
