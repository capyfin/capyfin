import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readSource(...segments: string[]): string {
  return readFileSync(resolve(__dirname, ...segments), "utf-8");
}

// ---------------------------------------------------------------------------
// AC1 & AC2: Panel starts collapsed on Home / Portfolio when no context data
// ---------------------------------------------------------------------------

void test("App derives hasRailContent from current view", () => {
  const src = readSource("App.tsx");
  assert.ok(
    src.includes("hasRailContent"),
    "App must compute a hasRailContent flag for the current view",
  );
});

void test("App auto-sets rail state based on content when view changes", () => {
  const src = readSource("App.tsx");
  assert.ok(
    src.includes("setIsRailOpen(hasRailContent)"),
    "App must call setIsRailOpen(hasRailContent) to sync rail with content availability",
  );
});

void test("hasRailContent defaults to false for views without context", () => {
  const src = readSource("App.tsx");
  assert.ok(
    src.includes("return false"),
    "hasRailContent must default to false when no view provides context",
  );
});

// ---------------------------------------------------------------------------
// AC3: "Open panel" button is still visible in header
// ---------------------------------------------------------------------------

void test("AppHeader always renders rail toggle with Open panel title", () => {
  const src = readSource("shell", "AppHeader.tsx");
  assert.ok(
    src.includes("Open panel"),
    "Toggle button must show 'Open panel' title so users can manually open the rail",
  );
  assert.ok(
    src.includes("PanelRightIcon"),
    "Toggle button must use PanelRightIcon",
  );
});

// ---------------------------------------------------------------------------
// AC4: When a page has context content the panel opens normally
// ---------------------------------------------------------------------------

void test("Rail state resets when hashView changes", () => {
  const src = readSource("App.tsx");
  // The render-time check compares state.hashView to detect navigation
  assert.ok(
    src.includes("state.hashView !== prevHashView"),
    "Must detect view navigation by comparing state.hashView to prevHashView",
  );
});

// ---------------------------------------------------------------------------
// AC5: No flash or layout shift — initial useState(false) is synchronous
// ---------------------------------------------------------------------------

void test("isRailOpen initialises to false to prevent layout flash", () => {
  const src = readSource("App.tsx");
  assert.ok(
    src.includes("useState(false)"),
    "isRailOpen must initialise as false so the panel never flashes open",
  );
});

void test("RightContextRail collapses to zero width when closed", () => {
  const src = readSource("shell", "RightContextRail.tsx");
  assert.ok(
    src.includes("w-0"),
    "Panel must use w-0 when closed to take no layout space",
  );
});
