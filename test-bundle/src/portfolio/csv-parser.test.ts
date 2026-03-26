import assert from "node:assert/strict";
import test from "node:test";
import { parseCsv } from "./csv-parser.ts";

function first<T>(arr: T[]): T {
  const val = arr.at(0);
  assert.ok(val !== undefined, "Expected array to have at least one element");
  return val;
}

void test("parses standard CSV with ticker,shares,cost basis headers", () => {
  const csv = `ticker,shares,cost basis
AAPL,100,150.50
MSFT,50,320.00`;
  const result = parseCsv(csv);
  assert.equal(result.rows.length, 2);
  const row0 = first(result.rows);
  assert.equal(row0.ticker, "AAPL");
  assert.equal(row0.shares, 100);
  assert.equal(row0.costBasis, 150.5);
  const row1 = result.rows.at(1);
  assert.ok(row1);
  assert.equal(row1.ticker, "MSFT");
  assert.equal(row1.shares, 50);
  assert.equal(row1.costBasis, 320);
});

void test("handles symbol alias for ticker", () => {
  const csv = `symbol,quantity,price
GOOG,30,140.00`;
  const result = parseCsv(csv);
  assert.equal(result.rows.length, 1);
  const row = first(result.rows);
  assert.equal(row.ticker, "GOOG");
  assert.equal(row.shares, 30);
  assert.equal(row.costBasis, 140);
});

void test("handles case-insensitive headers", () => {
  const csv = `TICKER,SHARES,COST BASIS
TSLA,10,250.00`;
  const result = parseCsv(csv);
  assert.equal(result.rows.length, 1);
  assert.equal(first(result.rows).ticker, "TSLA");
});

void test("parses optional name and sector columns", () => {
  const csv = `ticker,shares,cost basis,name,sector
AAPL,100,150.50,Apple Inc,Technology`;
  const result = parseCsv(csv);
  const row = first(result.rows);
  assert.equal(row.name, "Apple Inc");
  assert.equal(row.sector, "Technology");
});

void test("handles avg cost and average price aliases", () => {
  const csv = `ticker,units,avg cost
AMZN,20,180.00`;
  const result = parseCsv(csv);
  const row = first(result.rows);
  assert.equal(row.shares, 20);
  assert.equal(row.costBasis, 180);
});

void test("skips rows with missing required fields", () => {
  const csv = `ticker,shares,cost basis
AAPL,100,150.50
,50,320.00
GOOG,,140.00`;
  const result = parseCsv(csv);
  assert.equal(result.rows.length, 1);
  assert.equal(result.warnings.length, 2);
});

void test("returns error for CSV without recognized headers", () => {
  const csv = `foo,bar,baz
1,2,3`;
  const result = parseCsv(csv);
  assert.equal(result.rows.length, 0);
  assert.ok(result.warnings.some((w) => w.includes("ticker")));
});

void test("handles empty CSV", () => {
  const result = parseCsv("");
  assert.equal(result.rows.length, 0);
  assert.ok(result.warnings.length > 0);
});

void test("trims whitespace from values", () => {
  const csv = `ticker , shares , cost basis
 AAPL , 100 , 150.50 `;
  const result = parseCsv(csv);
  const row = first(result.rows);
  assert.equal(row.ticker, "AAPL");
  assert.equal(row.shares, 100);
});

void test("handles quoted CSV values", () => {
  const csv = `ticker,shares,"cost basis"
"AAPL",100,"1,150.50"`;
  const result = parseCsv(csv);
  const row = first(result.rows);
  assert.equal(row.ticker, "AAPL");
  assert.equal(row.costBasis, 1150.5);
});
