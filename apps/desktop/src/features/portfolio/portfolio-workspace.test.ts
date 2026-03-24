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

void test("cardSections includes a portfolio section", async () => {
  const mod = await import("../launchpad/card-registry");
  const section = mod.cardSections.find(
    (s: { id: string }) => s.id === "portfolio",
  );
  assert.ok(section);
  assert.equal(section.title, "Portfolio");
  assert.equal(section.cards.length, 3);
});
