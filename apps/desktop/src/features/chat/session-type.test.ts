import assert from "node:assert/strict";
import test from "node:test";
import { detectSessionType, SESSION_TYPE_META } from "./session-type";

// ---------------------------------------------------------------------------
// detectSessionType
// ---------------------------------------------------------------------------

void test("detectSessionType returns 'deep-dive' for Deep Dive labels", () => {
  assert.equal(detectSessionType("Deep Dive: AAPL"), "deep-dive");
});

void test("detectSessionType returns 'deep-dive' for standalone Deep Dive", () => {
  assert.equal(detectSessionType("Deep Dive"), "deep-dive");
});

void test("detectSessionType is case-insensitive", () => {
  assert.equal(detectSessionType("deep dive: TSLA"), "deep-dive");
});

void test("detectSessionType returns 'morning-brief' for Morning Brief labels", () => {
  assert.equal(detectSessionType("Morning Brief (6)"), "morning-brief");
});

void test("detectSessionType returns 'morning-brief' for bare Morning Brief", () => {
  assert.equal(detectSessionType("Morning Brief"), "morning-brief");
});

void test("detectSessionType returns 'position-review' for Position Review labels", () => {
  assert.equal(detectSessionType("Position Review: TSLA"), "position-review");
});

void test("detectSessionType returns 'fair-value' for Fair Value labels", () => {
  assert.equal(detectSessionType("Fair Value: MSFT"), "fair-value");
});

void test("detectSessionType returns 'general' for unrecognized labels", () => {
  assert.equal(detectSessionType("How do I read a balance sheet?"), "general");
});

void test("detectSessionType returns 'general' for New conversation", () => {
  assert.equal(detectSessionType("New conversation"), "general");
});

void test("detectSessionType returns 'general' for empty string", () => {
  assert.equal(detectSessionType(""), "general");
});

// ---------------------------------------------------------------------------
// SESSION_TYPE_META
// ---------------------------------------------------------------------------

void test("SESSION_TYPE_META has entries for all known session types", () => {
  const types = [
    "deep-dive",
    "morning-brief",
    "position-review",
    "fair-value",
    "general",
  ] as const;
  for (const t of types) {
    assert.ok(SESSION_TYPE_META[t], `Missing meta for type: ${t}`);
    assert.ok(SESSION_TYPE_META[t].icon, `Missing icon for type: ${t}`);
  }
});

void test("SESSION_TYPE_META general has no color accent", () => {
  assert.equal(SESSION_TYPE_META.general.color, undefined);
});

void test("SESSION_TYPE_META deep-dive has a blue color", () => {
  assert.ok(SESSION_TYPE_META["deep-dive"].color?.includes("blue"));
});

void test("SESSION_TYPE_META morning-brief has an amber color", () => {
  assert.ok(SESSION_TYPE_META["morning-brief"].color?.includes("amber"));
});

void test("SESSION_TYPE_META position-review has a green color", () => {
  assert.ok(SESSION_TYPE_META["position-review"].color?.includes("green"));
});

void test("SESSION_TYPE_META fair-value has an emerald color", () => {
  assert.ok(SESSION_TYPE_META["fair-value"].color?.includes("emerald"));
});
