import assert from "node:assert/strict";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { PortfolioService } from "./service.ts";

async function createTempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), "portfolio-test-"));
}

function first<T>(arr: T[]): T {
  const val = arr.at(0);
  assert.ok(val !== undefined, "Expected array to have at least one element");
  return val;
}

void test("getOverview returns empty portfolio when no data exists", async () => {
  const dir = await createTempDir();
  try {
    const service = new PortfolioService(dir, dir);
    const overview = await service.getOverview();
    assert.deepEqual(overview.holdings, []);
    assert.equal(overview.totalValue, 0);
    assert.deepEqual(overview.sectorExposure, []);
    assert.deepEqual(overview.concentrationAlerts, []);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("addHolding adds a position and returns updated overview", async () => {
  const dir = await createTempDir();
  try {
    const service = new PortfolioService(dir, dir);
    const overview = await service.addHolding({
      ticker: "AAPL",
      name: "Apple Inc",
      shares: 100,
      costBasis: 150,
      sector: "Technology",
    });
    assert.equal(overview.holdings.length, 1);
    const h = first(overview.holdings);
    assert.equal(h.ticker, "AAPL");
    assert.equal(h.shares, 100);
    assert.equal(h.costBasis, 150);
    assert.equal(h.weight, 100); // Only holding = 100%
    assert.equal(overview.totalValue, 15000);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("addHolding computes correct weights for multiple holdings", async () => {
  const dir = await createTempDir();
  try {
    const service = new PortfolioService(dir, dir);
    await service.addHolding({
      ticker: "AAPL",
      shares: 100,
      costBasis: 100,
    });
    const overview = await service.addHolding({
      ticker: "MSFT",
      shares: 100,
      costBasis: 100,
    });
    assert.equal(overview.holdings.length, 2);
    // Equal value holdings = 50% each
    const h0 = overview.holdings.at(0);
    const h1 = overview.holdings.at(1);
    assert.ok(h0);
    assert.ok(h1);
    assert.equal(h0.weight, 50);
    assert.equal(h1.weight, 50);
    assert.equal(overview.totalValue, 20000);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("removeHolding removes a position by ticker", async () => {
  const dir = await createTempDir();
  try {
    const service = new PortfolioService(dir, dir);
    await service.addHolding({ ticker: "AAPL", shares: 100, costBasis: 150 });
    await service.addHolding({ ticker: "MSFT", shares: 50, costBasis: 320 });
    const result = await service.removeHolding("AAPL");
    assert.equal(result.deleted, true);
    const overview = await service.getOverview();
    assert.equal(overview.holdings.length, 1);
    assert.equal(first(overview.holdings).ticker, "MSFT");
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("removeHolding returns deleted false for non-existent ticker", async () => {
  const dir = await createTempDir();
  try {
    const service = new PortfolioService(dir, dir);
    const result = await service.removeHolding("NOPE");
    assert.equal(result.deleted, false);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("importFromCsv replaces all holdings with parsed CSV data", async () => {
  const dir = await createTempDir();
  try {
    const service = new PortfolioService(dir, dir);
    await service.addHolding({ ticker: "OLD", shares: 10, costBasis: 10 });
    const csv = `ticker,shares,cost basis,sector
AAPL,100,150.50,Technology
MSFT,50,320.00,Technology
JPM,200,145.00,Financial`;
    const overview = await service.importFromCsv(csv);
    assert.equal(overview.holdings.length, 3);
    assert.equal(
      overview.holdings.find((h) => h.ticker === "OLD"),
      undefined,
    );
    assert.ok(overview.holdings.find((h) => h.ticker === "AAPL"));
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("computes sector exposure correctly", async () => {
  const dir = await createTempDir();
  try {
    const service = new PortfolioService(dir, dir);
    const csv = `ticker,shares,cost basis,sector
AAPL,100,100,Technology
MSFT,100,100,Technology
JPM,100,100,Financial`;
    const overview = await service.importFromCsv(csv);
    assert.equal(overview.sectorExposure.length, 2);
    const tech = overview.sectorExposure.find((s) => s.sector === "Technology");
    const fin = overview.sectorExposure.find((s) => s.sector === "Financial");
    assert.ok(tech);
    assert.ok(fin);
    // Two tech positions at 10000 each vs one financial at 10000 => tech 66.67%, fin 33.33%
    assert.ok(Math.abs(tech.weight - 66.67) < 0.1);
    assert.ok(Math.abs(fin.weight - 33.33) < 0.1);
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("generates concentration alert for position > 20%", async () => {
  const dir = await createTempDir();
  try {
    const service = new PortfolioService(dir, dir);
    const csv = `ticker,shares,cost basis
AAPL,100,100
MSFT,10,100
GOOG,10,100`;
    const overview = await service.importFromCsv(csv);
    // AAPL = 10000, MSFT = 1000, GOOG = 1000 => AAPL = 83.33%
    const posAlerts = overview.concentrationAlerts.filter(
      (a) => a.type === "position",
    );
    assert.ok(posAlerts.some((a) => a.name === "AAPL"));
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("generates concentration alert for sector > 40%", async () => {
  const dir = await createTempDir();
  try {
    const service = new PortfolioService(dir, dir);
    const csv = `ticker,shares,cost basis,sector
AAPL,100,100,Technology
MSFT,100,100,Technology
JPM,10,100,Financial`;
    const overview = await service.importFromCsv(csv);
    // Tech = 20000, Fin = 1000 => Tech = 95.2%
    const sectorAlerts = overview.concentrationAlerts.filter(
      (a) => a.type === "sector",
    );
    assert.ok(sectorAlerts.some((a) => a.name === "Technology"));
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("writes portfolio.csv to workspace dir on change", async () => {
  const stateDir = await createTempDir();
  const workspaceDir = await createTempDir();
  try {
    const service = new PortfolioService(stateDir, workspaceDir);
    await service.addHolding({
      ticker: "AAPL",
      shares: 100,
      costBasis: 150,
      sector: "Technology",
    });
    const csvContent = await readFile(
      join(workspaceDir, "portfolio.csv"),
      "utf-8",
    );
    assert.ok(csvContent.includes("AAPL"));
    assert.ok(csvContent.includes("ticker"));
  } finally {
    await rm(stateDir, { recursive: true });
    await rm(workspaceDir, { recursive: true });
  }
});
