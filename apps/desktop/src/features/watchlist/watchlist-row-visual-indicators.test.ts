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
// AC1: "+ Create case" buttons use a more prominent color
// ---------------------------------------------------------------------------

void test("Create case button uses a prominent actionable color", () => {
  const src = readComponent("WatchlistTable.tsx");

  // Find the button/span that contains "+ Create case"
  // It should use text-primary or text-amber-* for prominence
  const buttonMatch = /className="([^"]*)"[\s\S]{0,60}\+ Create case/.exec(src);
  assert.ok(buttonMatch, "Create case element must have className");
  const btnClass = buttonMatch[1] ?? "";
  assert.ok(
    btnClass.includes("text-primary") || btnClass.includes("text-amber"),
    "Create case button must use a prominent color (text-primary or text-amber-*), got: " +
      btnClass,
  );
});

void test("Create case span (non-interactive) also uses prominent color", () => {
  const src = readComponent("WatchlistTable.tsx");

  // The <span> version (when no onCreateCase callback) should also be prominent
  // Match the span element near "+ Create case" (shorter path than button with onClick)
  const spanMatch = /<span\s+className="([^"]*)">\s*\+ Create case/.exec(src);
  assert.ok(spanMatch, "Must have a <span> Create case variant");
  const cls = spanMatch[1] ?? "";
  assert.ok(
    cls.includes("text-primary") || cls.includes("text-amber"),
    "Span Create case must use a prominent color, got: " + cls,
  );
});

// ---------------------------------------------------------------------------
// AC2: Rows with existing cases show stance as a subtle colored dot indicator
// ---------------------------------------------------------------------------

void test("Ticker cell includes a status dot indicator with rounded-full", () => {
  const src = readComponent("WatchlistTable.tsx");

  // Should have a small rounded-full element (status dot) near the ticker
  assert.match(
    src,
    /rounded-full/,
    "Must include a rounded-full element as a status dot indicator",
  );
});

void test("Status dot has stance-specific colors for bullish and bearish", () => {
  const src = readComponent("WatchlistTable.tsx");

  // The helper or inline logic must include emerald for bullish and red for bearish
  assert.match(
    src,
    /bg-emerald/,
    "Status dot must use emerald color for bullish stance",
  );
  assert.match(
    src,
    /bg-red/,
    "Status dot must use red color for bearish stance",
  );
});

void test("No-case items have a muted status dot indicator", () => {
  const src = readComponent("WatchlistTable.tsx");

  // Rows without cases should have a subtle/muted dot
  assert.match(
    src,
    /bg-muted-foreground/,
    "No-case status indicator must use a muted-foreground color",
  );
});

// ---------------------------------------------------------------------------
// AC3: Visual distinguishability between rows
// ---------------------------------------------------------------------------

void test("Status dot is small for subtlety (size-1.5 or size-2)", () => {
  const src = readComponent("WatchlistTable.tsx");

  assert.match(
    src,
    /size-(?:1\.5|2)\b/,
    "Status dot must be small (size-1.5 or size-2) to maintain calm data-table aesthetic",
  );
});

void test("Status dot only renders when caseMap is provided", () => {
  const src = readComponent("WatchlistTable.tsx");

  // The dot should be conditional on caseMap
  assert.match(
    src,
    /caseMap[\s\S]{0,50}rounded-full|rounded-full[\s\S]{0,200}caseMap/,
    "Status dot rendering must be conditional on caseMap being provided",
  );
});

// ---------------------------------------------------------------------------
// AC4: Changes maintain calm data-table aesthetic
// ---------------------------------------------------------------------------

void test("Status dot uses opacity modifiers for subtle no-case indicator", () => {
  const src = readComponent("WatchlistTable.tsx");

  // The no-case dot should use opacity to stay subtle
  // e.g., bg-muted-foreground/25 or bg-muted-foreground/20
  assert.match(
    src,
    /bg-muted-foreground\/\d+/,
    "No-case dot must use opacity modifier (e.g., /25) for subtlety",
  );
});
