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
// Market Context — card wrapper treatment
// ---------------------------------------------------------------------------

void test("MarketContext section is wrapped in a card container with border", () => {
  const src = readComponent("MarketContext.tsx");
  assert.ok(
    src.includes("border-border/") && src.includes("bg-card/"),
    "MarketContext must have a card wrapper with border and bg-card classes",
  );
});

void test("MarketContext heading uses primary (text-xs) size", () => {
  const src = readComponent("MarketContext.tsx");
  // Primary sections should use text-xs, not text-[11px]
  assert.ok(
    src.includes("text-xs"),
    "MarketContext heading must use text-xs for primary emphasis",
  );
});

// ---------------------------------------------------------------------------
// Quick Actions — card treatment and icon sizing
// ---------------------------------------------------------------------------

void test("QuickActions heading uses primary (text-xs) size", () => {
  const src = readComponent("QuickActions.tsx");
  assert.ok(
    src.includes("text-xs"),
    "QuickActions heading must use text-xs for primary emphasis",
  );
});

void test("QuickActions buttons use size-5 icons for scannability", () => {
  const src = readComponent("QuickActions.tsx");
  assert.ok(
    src.includes("size-5"),
    "QuickActions icon elements must use size-5 for larger touch targets",
  );
});

// ---------------------------------------------------------------------------
// Secondary sections — heading differentiation
// ---------------------------------------------------------------------------

void test("RecentActivitySection heading uses secondary (text-[10px]) size", () => {
  const src = readComponent("RecentActivitySection.tsx");
  assert.ok(
    src.includes("text-[10px]"),
    "RecentActivitySection heading must use text-[10px] for secondary emphasis",
  );
});

void test("SuggestionsSection heading uses secondary (text-[10px]) size", () => {
  const src = readComponent("SuggestionsSection.tsx");
  assert.ok(
    src.includes("text-[10px]"),
    "SuggestionsSection heading must use text-[10px] for secondary emphasis",
  );
});

// ---------------------------------------------------------------------------
// Spacing rhythm — differentiated section gaps
// ---------------------------------------------------------------------------

void test("AttentionDashboard uses differentiated spacing, not uniform gap", () => {
  const src = readComponent("AttentionDashboard.tsx");
  // The dashboard should have individual margin classes for differentiated rhythm
  assert.ok(
    src.includes("mt-"),
    "AttentionDashboard must use mt-* classes for differentiated section spacing",
  );
});

void test("WorkflowsSection has extra top margin for visual separation", () => {
  const src = readComponent("WorkflowsSection.tsx");
  // Workflows should have mt-8 or similar large margin
  assert.ok(
    src.includes("mt-8") || src.includes("pt-"),
    "WorkflowsSection must have extra top margin or padding for visual separation",
  );
});

void test("LaunchpadWorkspace applies differentiated spacing to sections", () => {
  const src = readComponent("LaunchpadWorkspace.tsx");
  // The workspace should differentiate spacing between primary and secondary sections
  // Recent and Suggestions should have smaller top margin than Workflows
  assert.ok(
    src.includes("mt-"),
    "LaunchpadWorkspace must use differentiated margin classes for section rhythm",
  );
});
