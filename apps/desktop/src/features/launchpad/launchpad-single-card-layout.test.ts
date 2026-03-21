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
// Single-card / odd-card layout — last odd child spans full grid width
// ---------------------------------------------------------------------------

void test("CardSection grid applies col-span-2 to last odd child at sm breakpoint", () => {
  const src = readComponent("CardSection.tsx");

  // The grid must include a selector that targets :last-child:nth-child(odd)
  // and applies sm:col-span-2 so a lone card spans both columns
  assert.ok(
    src.includes("last-child:nth-child(odd)"),
    "CardSection must use :last-child:nth-child(odd) selector for odd-count spanning",
  );
  assert.ok(
    src.includes("col-span-2"),
    "CardSection must apply col-span-2 to the last odd child",
  );
});

void test("CardSection retains 2-column grid layout", () => {
  const src = readComponent("CardSection.tsx");

  // Must still have the base 2-column grid
  assert.ok(
    src.includes("grid-cols-2"),
    "CardSection must retain sm:grid-cols-2 for multi-card sections",
  );
  assert.ok(
    src.includes("grid-cols-1"),
    "CardSection must retain grid-cols-1 for mobile breakpoint",
  );
});

void test("CardSection odd-child span only activates at sm breakpoint", () => {
  const src = readComponent("CardSection.tsx");

  // The col-span-2 must only apply at the sm: breakpoint, not at mobile
  assert.match(
    src,
    /sm:col-span-2/,
    "col-span-2 must be scoped to sm: breakpoint to avoid affecting mobile layout",
  );
});
