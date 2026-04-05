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
// RecentActivitySection filters out unnamed sessions before slicing
// ---------------------------------------------------------------------------

void test("RecentActivitySection filters sessions before slicing to MAX_ITEMS", () => {
  const src = readComponent("RecentActivitySection.tsx");
  // The component must filter sessions with hex-like labels before limiting
  // The filter must appear before .slice(0, MAX_ITEMS) in the memo
  assert.ok(
    src.includes(".filter(") && src.includes("isHexLike"),
    "Must filter out unnamed (hex-like) sessions before slicing to MAX_ITEMS",
  );
});

// ---------------------------------------------------------------------------
// RecentActivitySection filters before sorting/slicing, not after
// ---------------------------------------------------------------------------

void test("RecentActivitySection applies filter before slice in the memo chain", () => {
  const src = readComponent("RecentActivitySection.tsx");
  const filterIndex = src.indexOf(".filter(");
  const sliceIndex = src.indexOf(".slice(0, MAX_ITEMS)");
  assert.ok(
    filterIndex > 0 && sliceIndex > 0 && filterIndex < sliceIndex,
    "Filter must be applied before slice so unnamed sessions don't consume slots",
  );
});

// ---------------------------------------------------------------------------
// "View all" link uses total sessions count, not filtered count
// ---------------------------------------------------------------------------

void test("RecentActivitySection 'View all' link considers total sessions length", () => {
  const src = readComponent("RecentActivitySection.tsx");
  // The View all link should still use sessions.length (all sessions),
  // not just the filtered count, so users can navigate to see everything
  assert.ok(
    src.includes("sessions.length > MAX_ITEMS"),
    "View all link must compare total sessions.length against MAX_ITEMS",
  );
});

// ---------------------------------------------------------------------------
// sanitizeSessionLabel is still present as a safety net
// ---------------------------------------------------------------------------

void test("RecentActivitySection retains sanitizeSessionLabel as safety net", () => {
  const src = readComponent("RecentActivitySection.tsx");
  assert.ok(
    src.includes("sanitizeSessionLabel"),
    "Must keep sanitizeSessionLabel as a fallback safety net for display labels",
  );
});

// ---------------------------------------------------------------------------
// Empty state still renders when no named sessions exist
// ---------------------------------------------------------------------------

void test("RecentActivitySection shows empty state when recentSessions is empty", () => {
  const src = readComponent("RecentActivitySection.tsx");
  assert.ok(
    src.includes("recentSessions.length === 0"),
    "Must show empty state when no named sessions are available after filtering",
  );
});
