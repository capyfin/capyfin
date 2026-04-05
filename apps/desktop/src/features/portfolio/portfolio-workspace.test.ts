import assert from "node:assert/strict";
import test from "node:test";
import { PORTFOLIO_EMPTY_TEXT } from "./components/PortfolioWorkspace";

void test("PORTFOLIO_EMPTY_TEXT is a non-empty string", () => {
  assert.ok(typeof PORTFOLIO_EMPTY_TEXT === "string");
  assert.ok(PORTFOLIO_EMPTY_TEXT.length > 0);
});

void test("PortfolioWorkspace exports a function component", async () => {
  const mod = await import("./components/PortfolioWorkspace");
  assert.equal(typeof mod.PortfolioWorkspace, "function");
});

void test("PortfolioEmptyState exports a function component", async () => {
  const mod = await import("./components/PortfolioEmptyState");
  assert.equal(typeof mod.PortfolioEmptyState, "function");
});

void test("PortfolioOverviewPanel exports a function component", async () => {
  const mod = await import("./components/PortfolioOverviewPanel");
  assert.equal(typeof mod.PortfolioOverviewPanel, "function");
});

void test("HoldingsTable exports a function component", async () => {
  const mod = await import("./components/HoldingsTable");
  assert.equal(typeof mod.HoldingsTable, "function");
});

void test("SectorExposure exports a function component", async () => {
  const mod = await import("./components/SectorExposure");
  assert.equal(typeof mod.SectorExposure, "function");
});

void test("ConcentrationAlerts exports a function component", async () => {
  const mod = await import("./components/ConcentrationAlerts");
  assert.equal(typeof mod.ConcentrationAlerts, "function");
});

void test("PortfolioActions exports a function component", async () => {
  const mod = await import("./components/PortfolioActions");
  assert.equal(typeof mod.PortfolioActions, "function");
});

void test("CsvImportDialog exports a function component", async () => {
  const mod = await import("./components/CsvImportDialog");
  assert.equal(typeof mod.CsvImportDialog, "function");
});

void test("AddHoldingDialog exports a function component", async () => {
  const mod = await import("./components/AddHoldingDialog");
  assert.equal(typeof mod.AddHoldingDialog, "function");
});

void test("portfolioCards are exported from card-registry", async () => {
  const mod = await import("../launchpad/card-registry");
  assert.ok(Array.isArray(mod.portfolioCards));
  assert.equal(mod.portfolioCards.length, 3);
});

void test("portfolioCards have expected IDs", async () => {
  const mod = await import("../launchpad/card-registry");
  const ids = mod.portfolioCards.map((c: { id: string }) => c.id);
  assert.ok(ids.includes("portfolio-analysis"));
  assert.ok(ids.includes("position-review"));
  assert.ok(ids.includes("benchmark-comparison"));
});

// --- New overview block component exports ---

void test("RiskMarkers exports a function component", async () => {
  const mod = await import("./components/RiskMarkers");
  assert.equal(typeof mod.RiskMarkers, "function");
});

void test("MarketRegimeFit exports a function component", async () => {
  const mod = await import("./components/MarketRegimeFit");
  assert.equal(typeof mod.MarketRegimeFit, "function");
});

void test("portfolio-utils exports buildRiskMarkers function", async () => {
  const mod = await import("./portfolio-utils");
  assert.equal(typeof mod.buildRiskMarkers, "function");
});

void test("portfolio-utils exports buildMarketRegimeFit function", async () => {
  const mod = await import("./portfolio-utils");
  assert.equal(typeof mod.buildMarketRegimeFit, "function");
});

// --- Visual separation / spacing tests ---

void test("PortfolioWorkspace uses gap-6 for section spacing (24px)", async () => {
  const fs = await import("node:fs");
  const source = fs.readFileSync(
    new URL("./components/PortfolioWorkspace.tsx", import.meta.url),
    "utf-8",
  );
  // Sections should have at least 24px gap (gap-6)
  assert.ok(
    source.includes("gap-6"),
    "PortfolioWorkspace should use gap-6 for 24px vertical spacing between sections",
  );
});

void test("PortfolioWorkspace has visual separator between overview and sections", async () => {
  const fs = await import("node:fs");
  const source = fs.readFileSync(
    new URL("./components/PortfolioWorkspace.tsx", import.meta.url),
    "utf-8",
  );
  // Should have a visual boundary after overview (border or separator)
  assert.ok(
    source.includes("border-b") ||
      source.includes("Separator") ||
      source.includes("border-border"),
    "PortfolioWorkspace should have visual separation between overview and section cards",
  );
});

void test("PortfolioActions is wrapped in a card container", async () => {
  const fs = await import("node:fs");
  const source = fs.readFileSync(
    new URL("./components/PortfolioActions.tsx", import.meta.url),
    "utf-8",
  );
  // PortfolioActions should use Card wrapper and CardHeader for consistency
  assert.ok(
    source.includes("CardHeader"),
    "PortfolioActions should use CardHeader for consistent section styling",
  );
});

void test("PortfolioActions quick action cards have adequate padding", async () => {
  const fs = await import("node:fs");
  const source = fs.readFileSync(
    new URL("./components/PortfolioActions.tsx", import.meta.url),
    "utf-8",
  );
  // Quick action cards should have at least p-4 padding
  assert.ok(
    source.includes("p-4") || source.includes("p-5") || source.includes("p-6"),
    "Quick Actions cards should have adequate padding (p-4, p-5, or p-6)",
  );
});

void test("PortfolioWorkspace suppresses position alerts for single-position portfolios", async () => {
  const fs = await import("node:fs");
  const source = fs.readFileSync(
    new URL("./components/PortfolioWorkspace.tsx", import.meta.url),
    "utf-8",
  );
  assert.ok(
    source.includes("isSinglePosition") &&
      source.includes('a.type === "position"'),
    "PortfolioWorkspace should filter position-type concentration alerts when portfolio has a single holding",
  );
});

// --- Sector count subtitle / stat card tests ---

void test("PortfolioOverviewPanel filters Unclassified from sector count in subtitle", async () => {
  const fs = await import("node:fs");
  const source = fs.readFileSync(
    new URL("./components/PortfolioOverviewPanel.tsx", import.meta.url),
    "utf-8",
  );
  // Should filter out "Unclassified" sectors before counting
  assert.ok(
    source.includes("Unclassified"),
    "PortfolioOverviewPanel should reference 'Unclassified' to filter it from sector counting",
  );
});

void test("PortfolioOverviewPanel omits sector text when realSectorCount is 0", async () => {
  const fs = await import("node:fs");
  const source = fs.readFileSync(
    new URL("./components/PortfolioOverviewPanel.tsx", import.meta.url),
    "utf-8",
  );
  // When sector count is 0, subtitle should not mention sectors
  assert.ok(
    source.includes("realSectorCount") ||
      source.includes("filteredSectorCount"),
    "PortfolioOverviewPanel should compute a filtered sector count excluding Unclassified",
  );
  // Should conditionally render sector portion of subtitle
  assert.ok(
    source.includes("realSectorCount > 0") ||
      source.includes("filteredSectorCount > 0"),
    "PortfolioOverviewPanel should conditionally show sector text only when real sectors exist",
  );
});

void test("PortfolioOverviewPanel stat card shows dash when no real sectors", async () => {
  const fs = await import("node:fs");
  const source = fs.readFileSync(
    new URL("./components/PortfolioOverviewPanel.tsx", import.meta.url),
    "utf-8",
  );
  // The Sectors stat card should display "—" when count is 0
  assert.ok(
    source.includes("\u2014") || source.includes("&mdash;"),
    "PortfolioOverviewPanel should display an em dash when no real sectors exist",
  );
});

// --- Overview blocks layout tests ---

void test("PortfolioWorkspace renders overview blocks grid above HoldingsTable", async () => {
  const fs = await import("node:fs");
  const source = fs.readFileSync(
    new URL("./components/PortfolioWorkspace.tsx", import.meta.url),
    "utf-8",
  );
  // Overview blocks should be in a grid
  assert.ok(
    source.includes("sm:grid-cols-2"),
    "Overview blocks should use a responsive grid layout",
  );
  // Overview blocks grid should appear before HoldingsTable
  const gridIdx = source.indexOf("Overview blocks");
  const tableIdx = source.indexOf("HoldingsTable");
  assert.ok(
    gridIdx < tableIdx,
    "Overview blocks should appear before HoldingsTable in the source",
  );
});

void test("PortfolioWorkspace imports RiskMarkers and MarketRegimeFit components", async () => {
  const fs = await import("node:fs");
  const source = fs.readFileSync(
    new URL("./components/PortfolioWorkspace.tsx", import.meta.url),
    "utf-8",
  );
  assert.ok(
    source.includes("RiskMarkers"),
    "Should import and use RiskMarkers",
  );
  assert.ok(
    source.includes("MarketRegimeFit"),
    "Should import and use MarketRegimeFit",
  );
});

void test("PortfolioWorkspace imports buildRiskMarkers and buildMarketRegimeFit", async () => {
  const fs = await import("node:fs");
  const source = fs.readFileSync(
    new URL("./components/PortfolioWorkspace.tsx", import.meta.url),
    "utf-8",
  );
  assert.ok(
    source.includes("buildRiskMarkers"),
    "Should import buildRiskMarkers from portfolio-utils",
  );
  assert.ok(
    source.includes("buildMarketRegimeFit"),
    "Should import buildMarketRegimeFit from portfolio-utils",
  );
});

void test("PortfolioWorkspace uses useMemo for riskMarkers and regimeFit", async () => {
  const fs = await import("node:fs");
  const source = fs.readFileSync(
    new URL("./components/PortfolioWorkspace.tsx", import.meta.url),
    "utf-8",
  );
  assert.ok(
    source.includes("useMemo"),
    "Should use useMemo for computed overview data",
  );
});

void test("cardSections includes a portfolio section", async () => {
  const mod = await import("../launchpad/card-registry");
  const section = mod.cardSections.find(
    (s: { id: string }) => s.id === "portfolio",
  );
  assert.ok(section);
  assert.equal(section.title, "Portfolio");
  assert.equal(section.cards.length, 3);
});
