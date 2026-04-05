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
// SectorExposure — show placeholder when all sectors are Unclassified
// ---------------------------------------------------------------------------

void test("SectorExposure handles all-Unclassified sectors with placeholder", () => {
  const src = readComponent("SectorExposure.tsx");
  // Must check for "Unclassified" or unclassified sectors to decide whether to show placeholder
  assert.ok(
    src.includes("Unclassified") || src.includes("unclassified"),
    "Must handle Unclassified sector case",
  );
});

void test("SectorExposure shows helpful message when no real sector data", () => {
  const src = readComponent("SectorExposure.tsx");
  // Must show a helpful placeholder message about adding sector data
  assert.ok(
    src.includes("sector data") ||
      src.includes("Sector data") ||
      src.includes("Add sector"),
    "Must show a helpful message about sector data when all unclassified",
  );
});

void test("SectorExposure still renders sector bars when real data present", () => {
  const src = readComponent("SectorExposure.tsx");
  // Must still render sector bars for real sector data
  assert.ok(
    src.includes("weight.toFixed"),
    "Must still render weight percentages for real sectors",
  );
});
