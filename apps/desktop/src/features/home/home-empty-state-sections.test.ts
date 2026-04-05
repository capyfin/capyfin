import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ---------------------------------------------------------------------------
// HomeWorkspace: Attention Now and Review Queue visible in empty state
// ---------------------------------------------------------------------------

const homeWorkspacePath = resolve(
  import.meta.dirname,
  "components/HomeWorkspace.tsx",
);
const homeWorkspaceSource = readFileSync(homeWorkspacePath, "utf-8");

const attentionNowPath = resolve(
  import.meta.dirname,
  "components/AttentionNow.tsx",
);
const attentionNowSource = readFileSync(attentionNowPath, "utf-8");

void test("HomeWorkspace no-cases branch includes AttentionNow component", () => {
  // Find the no-cases return block (after the !hasCases check)
  const noCasesMatch =
    /if\s*\(\s*!hasCases\s*\)\s*\{[\s\S]*?return\s*\(([\s\S]*?)\);\s*\}/.exec(
      homeWorkspaceSource,
    );
  assert.ok(noCasesMatch, "Should have a !hasCases branch");
  const noCasesBlock = noCasesMatch[1];
  assert.ok(noCasesBlock, "Should have content in no-cases branch");
  assert.ok(
    noCasesBlock.includes("<AttentionNow"),
    "AttentionNow should render in the no-cases branch",
  );
});

void test("HomeWorkspace no-cases branch includes ReviewQueueCard component", () => {
  const noCasesMatch =
    /if\s*\(\s*!hasCases\s*\)\s*\{[\s\S]*?return\s*\(([\s\S]*?)\);\s*\}/.exec(
      homeWorkspaceSource,
    );
  assert.ok(noCasesMatch, "Should have a !hasCases branch");
  const noCasesBlock = noCasesMatch[1];
  assert.ok(noCasesBlock, "Should have content in no-cases branch");
  assert.ok(
    noCasesBlock.includes("<ReviewQueueCard"),
    "ReviewQueueCard should render in the no-cases branch",
  );
});

void test("HomeWorkspace no-cases branch renders sections in correct order", () => {
  const noCasesMatch =
    /if\s*\(\s*!hasCases\s*\)\s*\{[\s\S]*?return\s*\(([\s\S]*?)\);\s*\}/.exec(
      homeWorkspaceSource,
    );
  assert.ok(noCasesMatch, "Should have a !hasCases branch");
  const noCasesBlock = noCasesMatch[1] ?? "";

  const emptyStateIdx = noCasesBlock.indexOf("<HomeEmptyState");
  const attentionIdx = noCasesBlock.indexOf("<AttentionNow");
  const reviewIdx = noCasesBlock.indexOf("<ReviewQueueCard");
  const marketIdx = noCasesBlock.indexOf("<PersonalizedMarketContext");
  const portfolioIdx = noCasesBlock.indexOf("<PortfolioAlerts");
  const quickIdx = noCasesBlock.indexOf("<QuickCreate");

  assert.ok(emptyStateIdx >= 0, "HomeEmptyState should be present");
  assert.ok(attentionIdx >= 0, "AttentionNow should be present");
  assert.ok(reviewIdx >= 0, "ReviewQueueCard should be present");
  assert.ok(marketIdx >= 0, "PersonalizedMarketContext should be present");

  // Correct order: EmptyState < AttentionNow < ReviewQueueCard < MarketContext < PortfolioAlerts < QuickCreate
  assert.ok(
    emptyStateIdx < attentionIdx,
    "HomeEmptyState should come before AttentionNow",
  );
  assert.ok(
    attentionIdx < reviewIdx,
    "AttentionNow should come before ReviewQueueCard",
  );
  assert.ok(
    reviewIdx < marketIdx,
    "ReviewQueueCard should come before PersonalizedMarketContext",
  );
  assert.ok(
    marketIdx < portfolioIdx,
    "PersonalizedMarketContext should come before PortfolioAlerts",
  );
  assert.ok(
    portfolioIdx < quickIdx,
    "PortfolioAlerts should come before QuickCreate",
  );
});

void test("HomeWorkspace builds attention bullets before the hasCases check", () => {
  // buildAttentionBullets should be called before the !hasCases conditional
  const bulletsBuildIdx = homeWorkspaceSource.indexOf("buildAttentionBullets");
  const hasCasesIdx = homeWorkspaceSource.indexOf("if (!hasCases)");
  assert.ok(bulletsBuildIdx >= 0, "buildAttentionBullets should be called");
  assert.ok(hasCasesIdx >= 0, "hasCases check should exist");
  assert.ok(
    bulletsBuildIdx < hasCasesIdx,
    "buildAttentionBullets should be called before the !hasCases check",
  );
});

void test("AttentionNow shows empty state message when bullets array is empty", () => {
  // The component should NOT return null when bullets is empty — it should render content
  const returnsNullWhenEmpty =
    /if\s*\(\s*bullets\.length\s*===\s*0\s*\)\s*return\s*null/.test(
      attentionNowSource,
    );
  assert.ok(
    !returnsNullWhenEmpty,
    "AttentionNow should not return null when bullets is empty — it should show an empty state",
  );
});

void test("AttentionNow renders the section heading regardless of bullet count", () => {
  // The "Attention Now" heading text should exist in the component
  assert.ok(
    attentionNowSource.includes("Attention Now"),
    "Component should contain 'Attention Now' heading",
  );
});

void test("HomeWorkspace no-cases branch does NOT include RecentCaseUpdates", () => {
  const noCasesMatch =
    /if\s*\(\s*!hasCases\s*\)\s*\{[\s\S]*?return\s*\(([\s\S]*?)\);\s*\}/.exec(
      homeWorkspaceSource,
    );
  assert.ok(noCasesMatch, "Should have a !hasCases branch");
  const noCasesBlock = noCasesMatch[1] ?? "";
  assert.ok(
    !noCasesBlock.includes("<RecentCaseUpdates"),
    "RecentCaseUpdates should NOT appear in empty state",
  );
});

void test("HomeWorkspace no-cases branch does NOT include UpcomingCatalysts", () => {
  const noCasesMatch =
    /if\s*\(\s*!hasCases\s*\)\s*\{[\s\S]*?return\s*\(([\s\S]*?)\);\s*\}/.exec(
      homeWorkspaceSource,
    );
  assert.ok(noCasesMatch, "Should have a !hasCases branch");
  const noCasesBlock = noCasesMatch[1] ?? "";
  assert.ok(
    !noCasesBlock.includes("<UpcomingCatalysts"),
    "UpcomingCatalysts should NOT appear in empty state",
  );
});
