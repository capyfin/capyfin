import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const featuresDir = resolve(__dirname, "../features");

function readFeatureFile(...segments: string[]): string {
  return readFileSync(resolve(featuresDir, ...segments), "utf-8");
}

// ---------------------------------------------------------------------------
// All workspace empty states must use the shared EmptyState component
// ---------------------------------------------------------------------------

void test("PortfolioEmptyState uses shared EmptyState component", () => {
  const src = readFeatureFile(
    "portfolio",
    "components",
    "PortfolioEmptyState.tsx",
  );
  assert.ok(
    src.includes("@/components/EmptyState"),
    "PortfolioEmptyState should import from shared empty-state",
  );
  assert.ok(
    src.includes("<EmptyState"),
    "PortfolioEmptyState should render <EmptyState>",
  );
});

void test("LibraryEmptyState uses shared EmptyState component", () => {
  const src = readFeatureFile("library", "components", "LibraryEmptyState.tsx");
  assert.ok(
    src.includes("@/components/EmptyState"),
    "LibraryEmptyState should import from shared empty-state",
  );
  assert.ok(
    src.includes("<EmptyState"),
    "LibraryEmptyState should render <EmptyState>",
  );
});

void test("WatchlistEmptyState uses shared EmptyState component", () => {
  const src = readFeatureFile(
    "watchlist",
    "components",
    "WatchlistEmptyState.tsx",
  );
  assert.ok(
    src.includes("@/components/EmptyState"),
    "WatchlistEmptyState should import from shared empty-state",
  );
  assert.ok(
    src.includes("<EmptyState"),
    "WatchlistEmptyState should render <EmptyState>",
  );
});

void test("AutomationEmptyState uses shared EmptyState component", () => {
  const src = readFeatureFile(
    "automation",
    "components",
    "AutomationEmptyState.tsx",
  );
  assert.ok(
    src.includes("@/components/EmptyState"),
    "AutomationEmptyState should import from shared empty-state",
  );
  assert.ok(
    src.includes("<EmptyState"),
    "AutomationEmptyState should render <EmptyState>",
  );
});

void test("BrainKnowledgeWorkspace uses shared EmptyState component", () => {
  const src = readFeatureFile(
    "brain",
    "components",
    "BrainKnowledgeWorkspace.tsx",
  );
  assert.ok(
    src.includes("@/components/EmptyState"),
    "BrainKnowledgeWorkspace should import from shared empty-state",
  );
  assert.ok(
    src.includes("<EmptyState"),
    "BrainKnowledgeWorkspace should render <EmptyState>",
  );
});

// ---------------------------------------------------------------------------
// Each page uses a distinct accent color
// ---------------------------------------------------------------------------

void test("Portfolio uses emerald color", () => {
  const src = readFeatureFile(
    "portfolio",
    "components",
    "PortfolioEmptyState.tsx",
  );
  assert.ok(
    src.includes('"emerald"'),
    "Portfolio should use emerald iconColor",
  );
});

void test("Library uses violet color", () => {
  const src = readFeatureFile("library", "components", "LibraryEmptyState.tsx");
  assert.ok(src.includes('"violet"'), "Library should use violet iconColor");
});

void test("Watchlist uses blue color", () => {
  const src = readFeatureFile(
    "watchlist",
    "components",
    "WatchlistEmptyState.tsx",
  );
  assert.ok(src.includes('"blue"'), "Watchlist should use blue iconColor");
});

void test("Automation uses amber color", () => {
  const src = readFeatureFile(
    "automation",
    "components",
    "AutomationEmptyState.tsx",
  );
  assert.ok(src.includes('"amber"'), "Automation should use amber iconColor");
});

void test("Brain References uses blue color", () => {
  const src = readFeatureFile(
    "brain",
    "components",
    "BrainKnowledgeWorkspace.tsx",
  );
  assert.ok(
    src.includes('"blue"'),
    "Brain References should use blue iconColor",
  );
});

void test("Brain Notes uses amber color", () => {
  const src = readFeatureFile(
    "brain",
    "components",
    "BrainKnowledgeWorkspace.tsx",
  );
  assert.ok(src.includes('"amber"'), "Brain Notes should use amber iconColor");
});

// ---------------------------------------------------------------------------
// All empty states have no duplicate glow pattern (deduplication check)
// ---------------------------------------------------------------------------

void test("PortfolioEmptyState does not duplicate glow pattern inline", () => {
  const src = readFeatureFile(
    "portfolio",
    "components",
    "PortfolioEmptyState.tsx",
  );
  assert.ok(
    !src.includes("blur-xl"),
    "Glow pattern should be in shared component, not duplicated inline",
  );
});

void test("LibraryEmptyState does not duplicate glow pattern inline", () => {
  const src = readFeatureFile("library", "components", "LibraryEmptyState.tsx");
  assert.ok(
    !src.includes("blur-xl"),
    "Glow pattern should be in shared component, not duplicated inline",
  );
});

void test("WatchlistEmptyState does not duplicate glow pattern inline", () => {
  const src = readFeatureFile(
    "watchlist",
    "components",
    "WatchlistEmptyState.tsx",
  );
  assert.ok(
    !src.includes("blur-xl"),
    "Glow pattern should be in shared component, not duplicated inline",
  );
});

void test("AutomationEmptyState does not duplicate glow pattern inline", () => {
  const src = readFeatureFile(
    "automation",
    "components",
    "AutomationEmptyState.tsx",
  );
  assert.ok(
    !src.includes("blur-xl"),
    "Glow pattern should be in shared component, not duplicated inline",
  );
});
