import assert from "node:assert/strict";
import test from "node:test";
import { actionCards, cardSections } from "./card-registry";

// ---------------------------------------------------------------------------
// Card registry — shape & completeness
// ---------------------------------------------------------------------------

void test("actionCards exports exactly 7 cards", () => {
  assert.equal(actionCards.length, 7);
});

void test("every card has a unique id", () => {
  const ids = actionCards.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
});

void test("every card satisfies the ActionCard contract", () => {
  for (const card of actionCards) {
    assert.ok(card.id, `card missing id`);
    assert.ok(card.title, `card ${card.id} missing title`);
    assert.ok(card.promise, `card ${card.id} missing promise`);
    assert.ok(card.icon, `card ${card.id} missing icon`);
    assert.ok(card.category, `card ${card.id} missing category`);
    assert.ok(card.input, `card ${card.id} missing input`);
    assert.ok(
      Array.isArray(card.skills) && card.skills.length > 0,
      `card ${card.id} must have at least one skill`,
    );
    assert.ok(card.prompt, `card ${card.id} missing prompt`);
  }
});

void test("Morning Brief card has correct metadata", () => {
  const card = actionCards.find((c) => c.id === "morning-brief");
  assert.ok(card, "morning-brief card not found");
  assert.equal(card.category, "today");
  assert.equal(card.input, "none");
  assert.deepEqual(card.skills, ["morning-brief"]);
  assert.equal(card.persona, "macro-analyst");
});

void test("Market Health card has correct metadata", () => {
  const card = actionCards.find((c) => c.id === "market-health");
  assert.ok(card, "market-health card not found");
  assert.equal(card.category, "today");
  assert.equal(card.input, "none");
  assert.deepEqual(card.skills, ["market-health"]);
  assert.equal(card.persona, "macro-analyst");
});

void test("Deep Dive card has correct metadata", () => {
  const card = actionCards.find((c) => c.id === "deep-dive");
  assert.ok(card, "deep-dive card not found");
  assert.equal(card.category, "research");
  assert.equal(card.input, "ticker");
  assert.deepEqual(card.skills, ["deep-dive"]);
  assert.equal(card.persona, "fundamental-analyst");
});

void test("Fair Value card has correct metadata", () => {
  const card = actionCards.find((c) => c.id === "fair-value");
  assert.ok(card, "fair-value card not found");
  assert.equal(card.category, "research");
  assert.equal(card.input, "ticker");
  assert.deepEqual(card.skills, ["fair-value"]);
  assert.equal(card.persona, "fundamental-analyst");
});

// ---------------------------------------------------------------------------
// Card sections
// ---------------------------------------------------------------------------

void test("cardSections exports sections with cards", () => {
  assert.ok(Array.isArray(cardSections));
  assert.ok(cardSections.length >= 3, "should have at least Today, Research, and Find Setups");
});

void test("Today section contains Morning Brief and Market Health", () => {
  const today = cardSections.find((s) => s.id === "today");
  assert.ok(today, "today section not found");
  assert.equal(today.title, "Today");
  const ids = today.cards.map((c) => c.id);
  assert.ok(ids.includes("morning-brief"));
  assert.ok(ids.includes("market-health"));
});

void test("Research section contains Deep Dive, Fair Value, Earnings X-Ray, and Bull / Bear", () => {
  const research = cardSections.find((s) => s.id === "research");
  assert.ok(research, "research section not found");
  assert.equal(research.title, "Research");
  const ids = research.cards.map((c) => c.id);
  assert.ok(ids.includes("deep-dive"));
  assert.ok(ids.includes("fair-value"));
  assert.ok(ids.includes("earnings-xray"));
  assert.ok(ids.includes("bull-bear"));
});

void test("Earnings X-Ray card has correct metadata", () => {
  const card = actionCards.find((c) => c.id === "earnings-xray");
  assert.ok(card, "earnings-xray card not found");
  assert.equal(card.category, "research");
  assert.equal(card.input, "ticker");
  assert.deepEqual(card.skills, ["earnings-xray"]);
  assert.equal(card.persona, "fundamental-analyst");
});

void test("Bull / Bear card has correct metadata", () => {
  const card = actionCards.find((c) => c.id === "bull-bear");
  assert.ok(card, "bull-bear card not found");
  assert.equal(card.category, "research");
  assert.equal(card.input, "ticker");
  assert.deepEqual(card.skills, ["bull-bear"]);
  assert.equal(card.persona, "fundamental-analyst");
});

void test("Breakout Setups card has correct metadata", () => {
  const card = actionCards.find((c) => c.id === "breakout-setups");
  assert.ok(card, "breakout-setups card not found");
  assert.equal(card.category, "setups");
  assert.equal(card.input, "none");
  assert.deepEqual(card.skills, ["breakout-setups"]);
  assert.equal(card.persona, "technical-analyst");
});

void test("Find Setups section contains Breakout Setups", () => {
  const setups = cardSections.find((s) => s.id === "setups");
  assert.ok(setups, "setups section not found");
  assert.equal(setups.title, "Find Setups");
  const ids = setups.cards.map((c) => c.id);
  assert.ok(ids.includes("breakout-setups"));
});

void test("no card exposes skill IDs, persona names, or prompt text to the user-facing fields", () => {
  for (const card of actionCards) {
    assert.ok(
      !card.title.includes("SKILL"),
      `card ${card.id} title exposes internals`,
    );
    assert.ok(
      !card.promise.includes("persona"),
      `card ${card.id} promise exposes internals`,
    );
  }
});
