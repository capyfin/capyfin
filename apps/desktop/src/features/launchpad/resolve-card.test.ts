import assert from "node:assert/strict";
import test from "node:test";
import { resolveCard } from "./resolve-card";
import type { ActionCard } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCard(overrides: Partial<ActionCard> = {}): ActionCard {
  return {
    id: "breakout-setups",
    title: "Breakout Setups",
    promise: "VCP patterns, base breakouts, Stage 2 uptrend candidates",
    icon: "TrendingUp",
    category: "setups",
    input: "none",
    skills: ["breakout-setups"],
    persona: "technical-analyst",
    prompt: "Scan for high-quality breakout setups.",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// resolveCard — without tier0Override
// ---------------------------------------------------------------------------

void test("resolveCard returns card unchanged when no tier0Override", () => {
  const card = makeCard();
  const resolved = resolveCard(card, false);
  assert.equal(resolved.input, "none");
  assert.equal(resolved.prompt, card.prompt);
});

void test("resolveCard returns card unchanged when FMP is connected", () => {
  const card = makeCard({
    tier0Override: {
      input: "tickers",
      prompt: "Analyze {tickers} for breakout setups.",
    },
  });
  const resolved = resolveCard(card, true);
  assert.equal(resolved.input, "none");
  assert.equal(resolved.prompt, "Scan for high-quality breakout setups.");
});

// ---------------------------------------------------------------------------
// resolveCard — with tier0Override applied
// ---------------------------------------------------------------------------

void test("resolveCard applies tier0Override when FMP is not connected", () => {
  const card = makeCard({
    tier0Override: {
      input: "tickers",
      prompt: "Analyze {tickers} for breakout setups.",
    },
  });
  const resolved = resolveCard(card, false);
  assert.equal(resolved.input, "tickers");
  assert.equal(resolved.prompt, "Analyze {tickers} for breakout setups.");
});

void test("resolveCard preserves non-overridden fields", () => {
  const card = makeCard({
    tier0Override: {
      input: "tickers",
      prompt: "Analyze {tickers}.",
    },
  });
  const resolved = resolveCard(card, false);
  assert.equal(resolved.id, "breakout-setups");
  assert.equal(resolved.title, "Breakout Setups");
  assert.equal(resolved.icon, "TrendingUp");
  assert.equal(resolved.category, "setups");
  assert.deepEqual(resolved.skills, ["breakout-setups"]);
  assert.equal(resolved.persona, "technical-analyst");
});

void test("resolveCard does not mutate original card object", () => {
  const card = makeCard({
    tier0Override: {
      input: "tickers",
      prompt: "Analyze {tickers}.",
    },
  });
  const originalInput = card.input;
  const originalPrompt = card.prompt;
  resolveCard(card, false);
  assert.equal(card.input, originalInput);
  assert.equal(card.prompt, originalPrompt);
});
