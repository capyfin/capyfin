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
// MarketContext component
// ---------------------------------------------------------------------------

void test("MarketContext component file exists", () => {
  const src = readComponent("MarketContext.tsx");
  assert.ok(src.length > 0, "MarketContext.tsx must exist and not be empty");
});

void test("MarketContext renders a section header", () => {
  const src = readComponent("MarketContext.tsx");
  assert.ok(
    src.includes("Market Context"),
    "Must include 'Market Context' section header",
  );
});

void test("MarketContext includes regime summary area", () => {
  const src = readComponent("MarketContext.tsx");
  assert.ok(
    src.includes("regime") || src.includes("Regime"),
    "Must reference market regime per spec 9.4",
  );
});

void test("MarketContext includes index snapshot signal", () => {
  const src = readComponent("MarketContext.tsx");
  assert.ok(
    src.includes("Index snapshot") || src.includes("index"),
    "Must include index snapshot signal area",
  );
});

void test("MarketContext includes sector signals", () => {
  const src = readComponent("MarketContext.tsx");
  assert.ok(
    src.includes("Sector leadership") || src.includes("sector"),
    "Must include sector leadership/weakness signals",
  );
});

void test("MarketContext shows data provider placeholder", () => {
  const src = readComponent("MarketContext.tsx");
  assert.ok(
    src.includes("data provider") || src.includes("Connect"),
    "Must show placeholder for connecting data provider",
  );
});

// ---------------------------------------------------------------------------
// WatchlistChanges component
// ---------------------------------------------------------------------------

void test("WatchlistChanges component file exists", () => {
  const src = readComponent("WatchlistChanges.tsx");
  assert.ok(src.length > 0, "WatchlistChanges.tsx must exist and not be empty");
});

void test("WatchlistChanges renders a section header", () => {
  const src = readComponent("WatchlistChanges.tsx");
  assert.ok(
    src.includes("Watchlist Changes"),
    "Must include 'Watchlist Changes' section header",
  );
});

void test("WatchlistChanges returns null when no changes", () => {
  const src = readComponent("WatchlistChanges.tsx");
  assert.ok(
    src.includes("return null"),
    "Must return null when changes array is empty",
  );
});

void test("WatchlistChanges displays change type badges", () => {
  const src = readComponent("WatchlistChanges.tsx");
  assert.ok(
    src.includes("stance-changed") &&
      src.includes("confidence-changed") &&
      src.includes("case-updated"),
    "Must handle all three change types",
  );
});

void test("WatchlistChanges shows ticker for each change", () => {
  const src = readComponent("WatchlistChanges.tsx");
  assert.ok(
    src.includes("change.ticker"),
    "Must display the ticker for each watchlist change",
  );
});

void test("WatchlistChanges navigates to watchlist on click", () => {
  const src = readComponent("WatchlistChanges.tsx");
  assert.ok(
    src.includes("#watchlist"),
    "Must navigate to watchlist view on click",
  );
});

void test("WatchlistChanges limits displayed items", () => {
  const src = readComponent("WatchlistChanges.tsx");
  assert.ok(
    src.includes("slice(0,") || src.includes("slice(0, 5"),
    "Must limit the number of displayed changes",
  );
});

// ---------------------------------------------------------------------------
// PortfolioRisks component
// ---------------------------------------------------------------------------

void test("PortfolioRisks component file exists", () => {
  const src = readComponent("PortfolioRisks.tsx");
  assert.ok(src.length > 0, "PortfolioRisks.tsx must exist and not be empty");
});

void test("PortfolioRisks renders a section header", () => {
  const src = readComponent("PortfolioRisks.tsx");
  assert.ok(
    src.includes("Portfolio Risks"),
    "Must include 'Portfolio Risks' section header",
  );
});

void test("PortfolioRisks returns null when no risk signals", () => {
  const src = readComponent("PortfolioRisks.tsx");
  assert.ok(
    src.includes("return null"),
    "Must return null when no risk signals to display",
  );
});

void test("PortfolioRisks displays concentration alerts", () => {
  const src = readComponent("PortfolioRisks.tsx");
  assert.ok(
    src.includes("concentrationAlerts") && src.includes("alert.weight"),
    "Must render concentration alert weights",
  );
});

void test("PortfolioRisks shows positions needing review", () => {
  const src = readComponent("PortfolioRisks.tsx");
  assert.ok(
    src.includes("positionsNeedingReview") && src.includes("overdue"),
    "Must show count of positions overdue for review",
  );
});

void test("PortfolioRisks navigates to portfolio on review click", () => {
  const src = readComponent("PortfolioRisks.tsx");
  assert.ok(
    src.includes("#portfolio"),
    "Must navigate to portfolio view when clicking review",
  );
});

void test("PortfolioRisks handles both position and sector alert types", () => {
  const src = readComponent("PortfolioRisks.tsx");
  assert.ok(
    src.includes('"position"') && src.includes("sector at"),
    "Must differentiate position vs sector concentration alerts",
  );
});

// ---------------------------------------------------------------------------
// AttentionDashboard integration
// ---------------------------------------------------------------------------

void test("AttentionDashboard imports and renders all three new blocks", () => {
  const src = readComponent("AttentionDashboard.tsx");
  assert.ok(
    src.includes("MarketContext"),
    "AttentionDashboard must import MarketContext",
  );
  assert.ok(
    src.includes("WatchlistChanges"),
    "AttentionDashboard must import WatchlistChanges",
  );
  assert.ok(
    src.includes("PortfolioRisks"),
    "AttentionDashboard must import PortfolioRisks",
  );
});

void test("AttentionDashboard fetches portfolio data", () => {
  const src = readComponent("AttentionDashboard.tsx");
  assert.ok(
    src.includes("getPortfolio"),
    "AttentionDashboard must fetch portfolio data for PortfolioRisks",
  );
});
