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
// MarketContext — hide empty category labels when no data
// ---------------------------------------------------------------------------

void test("MarketContext conditionally renders signal placeholders", () => {
  const src = readComponent("MarketContext.tsx");
  // The signal placeholders (Index snapshot, Sector leadership, Sector weakness)
  // must be conditionally rendered based on data availability
  assert.ok(
    src.includes("hasMarketData") || src.includes("marketData"),
    "Must check for market data availability before rendering signal labels",
  );
});

void test("MarketContext hides Index snapshot label when no data", () => {
  const src = readComponent("MarketContext.tsx");
  // "Index snapshot" text should only appear inside a conditional block
  const indexSnapshotIdx = src.indexOf("Index snapshot");
  if (indexSnapshotIdx === -1) {
    // If entirely removed when no data, that's also acceptable
    assert.ok(true);
    return;
  }
  // If present, the entire signal block must be guarded by a conditional
  const before = src.slice(
    Math.max(0, indexSnapshotIdx - 500),
    indexSnapshotIdx,
  );
  assert.ok(
    before.includes("hasMarketData") || before.includes("marketData"),
    "Index snapshot must be conditionally rendered based on market data",
  );
});

void test("MarketContext hides Sector leadership label when no data", () => {
  const src = readComponent("MarketContext.tsx");
  const sectorIdx = src.indexOf("Sector leadership");
  if (sectorIdx === -1) {
    assert.ok(true);
    return;
  }
  const before = src.slice(Math.max(0, sectorIdx - 800), sectorIdx);
  assert.ok(
    before.includes("hasMarketData") || before.includes("marketData"),
    "Sector leadership must be conditionally rendered based on market data",
  );
});

void test("MarketContext hides Sector weakness label when no data", () => {
  const src = readComponent("MarketContext.tsx");
  const sectorIdx = src.indexOf("Sector weakness");
  if (sectorIdx === -1) {
    assert.ok(true);
    return;
  }
  const before = src.slice(Math.max(0, sectorIdx - 1200), sectorIdx);
  assert.ok(
    before.includes("hasMarketData") || before.includes("marketData"),
    "Sector weakness must be conditionally rendered based on market data",
  );
});

void test("MarketContext still shows warning message when no data", () => {
  const src = readComponent("MarketContext.tsx");
  assert.ok(
    src.includes("Market regime data not yet connected") ||
      src.includes("data provider"),
    "Must still show the data provider warning when no data",
  );
});
