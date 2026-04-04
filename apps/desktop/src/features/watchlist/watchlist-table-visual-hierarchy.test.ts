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
// AC1: Ticker column text is visually heavier (bold) than other cells
// ---------------------------------------------------------------------------

void test("Ticker cell uses font-bold and a larger font size than other cells", () => {
  const src = readComponent("WatchlistTable.tsx");

  // Ticker must be bold
  assert.ok(
    src.includes("font-bold"),
    "Ticker cell must use font-bold for visual emphasis",
  );

  // Ticker should use text-sm or text-base (larger than the default text-[13px])
  // In JSX, className comes before the {item.ticker} child
  assert.match(
    src,
    /text-(?:sm|base)\s+font-bold[\s\S]{0,200}item\.ticker/,
    "Ticker cell must use a larger font size (text-sm or text-base) for emphasis",
  );
});

// ---------------------------------------------------------------------------
// AC2: "No case" cells render as an actionable element
// ---------------------------------------------------------------------------

void test("No-case cells render as a clickable element with actionable text", () => {
  const src = readComponent("WatchlistTable.tsx");

  // Should NOT render plain "No case" text
  assert.ok(
    !src.includes('"No case"'),
    'Should not render plain "No case" text — it must be actionable',
  );

  // Should show "+ Create case" or similar actionable phrasing
  assert.ok(
    src.includes("Create case"),
    'No-case state should show actionable text like "+ Create case"',
  );

  // Must be a <button> element or use onClick for the no-case state
  assert.match(
    src,
    /Create case[\s\S]{0,500}onClick|onClick[\s\S]{0,500}Create case/,
    '"Create case" must be clickable (have an onClick handler)',
  );
});

// ---------------------------------------------------------------------------
// AC3: Empty NOTE cells show a placeholder suggesting adding a note
// ---------------------------------------------------------------------------

void test("Empty note cells show an add-note placeholder instead of em-dash", () => {
  const src = readComponent("WatchlistTable.tsx");

  // Should show "Add note" placeholder text for empty notes
  assert.ok(
    src.includes("Add note"),
    'Empty note cells must show an "Add note" placeholder',
  );
});

// ---------------------------------------------------------------------------
// AC4: Row action buttons have a visible icon
// ---------------------------------------------------------------------------

void test("Row action button is always visible (not hidden behind opacity-0)", () => {
  const src = readComponent("WatchlistTable.tsx");

  // The MoreHorizontalIcon must exist
  assert.ok(
    src.includes("MoreHorizontalIcon"),
    "Action menu must use MoreHorizontalIcon",
  );

  // The action button should NOT be fully invisible by default
  // It should either have reduced opacity or be visible
  // Check that the button near MoreHorizontalIcon doesn't use opacity-0
  const actionBtnMatch =
    /DropdownMenuTrigger[\s\S]{0,300}className="([^"]*)"/.exec(src);
  assert.ok(actionBtnMatch, "DropdownMenuTrigger button must have a className");
  const className = actionBtnMatch[1] ?? "";
  assert.ok(
    !className.includes("opacity-0"),
    "Action button must not be fully invisible (opacity-0) — it should be at least partially visible",
  );
});

// ---------------------------------------------------------------------------
// AC5: Table rows have a visible hover state
// ---------------------------------------------------------------------------

void test("Table rows have a hover background state", () => {
  const src = readComponent("WatchlistTable.tsx");

  // Row must include a hover:bg- class for hover state
  assert.match(
    src,
    /hover:bg-/,
    "Table rows must have a hover:bg- class for hover state",
  );
});
