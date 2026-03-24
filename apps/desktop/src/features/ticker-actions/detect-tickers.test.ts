import assert from "node:assert/strict";
import test from "node:test";
import { detectTickers } from "./detect-tickers";

void test("detects $TICKER pattern", () => {
  const matches = detectTickers("Check out $AAPL today");
  assert.equal(matches.length, 1);
  const m = matches[0];
  assert.ok(m, "Match should exist");
  assert.equal(m.ticker, "AAPL");
  assert.equal(m.startIndex, 10);
  assert.equal(m.endIndex, 15);
});

void test("detects multiple tickers", () => {
  const matches = detectTickers("$AAPL vs $MSFT comparison");
  assert.equal(matches.length, 2);
  const first = matches[0];
  const second = matches[1];
  assert.ok(first, "First match should exist");
  assert.ok(second, "Second match should exist");
  assert.equal(first.ticker, "AAPL");
  assert.equal(second.ticker, "MSFT");
});

void test("detects tickers with 1-5 letter symbols", () => {
  const matches = detectTickers("$A and $GOOGL and $BRK");
  assert.equal(matches.length, 3);
  const [m0, m1, m2] = matches;
  assert.ok(m0, "Match 0 should exist");
  assert.ok(m1, "Match 1 should exist");
  assert.ok(m2, "Match 2 should exist");
  assert.equal(m0.ticker, "A");
  assert.equal(m1.ticker, "GOOGL");
  assert.equal(m2.ticker, "BRK");
});

void test("does not match $ followed by lowercase", () => {
  const matches = detectTickers("cost is $100 or $abc");
  assert.equal(matches.length, 0);
});

void test("does not match symbols longer than 5 chars", () => {
  const matches = detectTickers("$TOOLONG is not valid");
  assert.equal(matches.length, 0);
});

void test("returns empty array for text with no tickers", () => {
  const matches = detectTickers("No tickers here at all");
  assert.equal(matches.length, 0);
});

void test("returns empty array for empty string", () => {
  const matches = detectTickers("");
  assert.equal(matches.length, 0);
});

void test("handles tickers at start and end of string", () => {
  const matches = detectTickers("$TSLA is great and so is $NVDA");
  assert.equal(matches.length, 2);
  const first = matches[0];
  const second = matches[1];
  assert.ok(first, "First match should exist");
  assert.ok(second, "Second match should exist");
  assert.equal(first.ticker, "TSLA");
  assert.equal(second.ticker, "NVDA");
});

void test("handles ticker with trailing punctuation", () => {
  const matches = detectTickers("I like $AAPL, $MSFT, and $GOOG.");
  assert.equal(matches.length, 3);
});
