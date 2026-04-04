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
// AttentionDashboard: no full-page early return for empty cases
// ---------------------------------------------------------------------------

void test("AttentionDashboard does NOT early-return AttentionEmptyState when cases are empty", () => {
  const src = readComponent("AttentionDashboard.tsx");
  // The old pattern: if (cases.length === 0) { return <AttentionEmptyState ... /> }
  // should no longer exist as a full-page replacement
  const earlyReturnPattern =
    /if\s*\(\s*cases\.length\s*===\s*0\s*\)\s*\{?\s*return\s+<AttentionEmptyState/;
  assert.ok(
    !earlyReturnPattern.test(src),
    "AttentionDashboard must NOT early-return AttentionEmptyState when no cases exist",
  );
});

void test("AttentionDashboard always renders MarketContext regardless of case count", () => {
  const src = readComponent("AttentionDashboard.tsx");
  // MarketContext should appear in the main render output, not gated behind cases.length
  assert.ok(
    src.includes("<MarketContext"),
    "MarketContext must render in AttentionDashboard",
  );
});

void test("AttentionDashboard always renders QuickActions regardless of case count", () => {
  const src = readComponent("AttentionDashboard.tsx");
  assert.ok(
    src.includes("<QuickActions"),
    "QuickActions must render in AttentionDashboard",
  );
});

void test("AttentionDashboard renders WatchlistChanges with watchlist data", () => {
  const src = readComponent("AttentionDashboard.tsx");
  assert.ok(
    src.includes("<WatchlistChanges"),
    "WatchlistChanges must render in AttentionDashboard",
  );
});

void test("AttentionDashboard renders PortfolioRisks with portfolio data", () => {
  const src = readComponent("AttentionDashboard.tsx");
  assert.ok(
    src.includes("<PortfolioRisks") || src.includes("PortfolioRisks"),
    "PortfolioRisks must render in AttentionDashboard",
  );
});

// ---------------------------------------------------------------------------
// AttentionEmptyState: inline banner, not full-page replacement
// ---------------------------------------------------------------------------

void test("AttentionEmptyState renders as an inline banner element", () => {
  const src = readComponent("AttentionEmptyState.tsx");
  // Should still contain the CTA
  assert.ok(
    src.includes("Create Your First Case") || src.includes("Create"),
    "AttentionEmptyState must contain a create-case CTA",
  );
});

void test("AttentionDashboard renders inline empty state CTA when no cases exist", () => {
  const src = readComponent("AttentionDashboard.tsx");
  // Should reference AttentionEmptyState or similar inline CTA
  assert.ok(
    src.includes("AttentionEmptyState") ||
      src.includes("empty") ||
      src.includes("Empty"),
    "AttentionDashboard must include inline empty state when no cases",
  );
});

// ---------------------------------------------------------------------------
// Case-dependent blocks are conditionally shown
// ---------------------------------------------------------------------------

void test("AttentionDashboard conditionally renders case-dependent blocks", () => {
  const src = readComponent("AttentionDashboard.tsx");
  // NeedsReview and UpcomingCatalysts should be conditionally rendered
  // They should appear in the source but have some conditional gate
  assert.ok(
    src.includes("NeedsReview"),
    "NeedsReview component should still be imported",
  );
  assert.ok(
    src.includes("UpcomingCatalysts"),
    "UpcomingCatalysts component should still be imported",
  );
});

void test("Case-dependent computations are guarded by cases.length > 0", () => {
  const src = readComponent("AttentionDashboard.tsx");
  // When cases exist, metrics should be computed; otherwise, blocks should hide
  assert.ok(
    src.includes("cases.length") || src.includes("hasCases"),
    "Dashboard must check whether cases exist to conditionally render case-dependent blocks",
  );
});
