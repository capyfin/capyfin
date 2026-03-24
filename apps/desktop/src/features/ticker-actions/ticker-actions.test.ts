import assert from "node:assert/strict";
import test from "node:test";
import { getTickerActions } from "./get-ticker-actions";

void test("getTickerActions returns actions for ticker-input cards", () => {
  const actions = getTickerActions();
  assert.ok(actions.length > 0, "Should return at least one action");
});

void test("getTickerActions includes Deep Dive", () => {
  const actions = getTickerActions();
  const labels = actions.map((a) => a.title);
  assert.ok(labels.includes("Deep Dive"), "Should include Deep Dive");
});

void test("getTickerActions includes Fair Value", () => {
  const actions = getTickerActions();
  const labels = actions.map((a) => a.title);
  assert.ok(labels.includes("Fair Value"), "Should include Fair Value");
});

void test("getTickerActions includes Bull / Bear", () => {
  const actions = getTickerActions();
  const labels = actions.map((a) => a.title);
  assert.ok(labels.includes("Bull / Bear"), "Should include Bull / Bear");
});

void test("getTickerActions includes Earnings X-Ray", () => {
  const actions = getTickerActions();
  const labels = actions.map((a) => a.title);
  assert.ok(labels.includes("Earnings X-Ray"), "Should include Earnings X-Ray");
});

void test("getTickerActions includes Position Review", () => {
  const actions = getTickerActions();
  const labels = actions.map((a) => a.title);
  assert.ok(
    labels.includes("Position Review"),
    "Should include Position Review",
  );
});

void test("all returned actions have ticker input mode", () => {
  const actions = getTickerActions();
  for (const action of actions) {
    assert.equal(
      action.input,
      "ticker",
      `${action.title} should have input=ticker`,
    );
  }
});

void test("getTickerActions returns unique cards", () => {
  const actions = getTickerActions();
  const ids = actions.map((a) => a.id);
  assert.equal(new Set(ids).size, ids.length, "Should have unique ids");
});
