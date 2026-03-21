import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCardPrompt,
  buildDisplayLabel,
  makeUniqueLabel,
  QUALITY_GATE,
} from "./prompt-builder";
import type { ActionCard } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCard(overrides: Partial<ActionCard> = {}): ActionCard {
  return {
    id: "deep-dive",
    title: "Deep Dive",
    promise: "SEC filings, competitive moat, financials, risks",
    icon: "Search",
    category: "research",
    input: "ticker",
    skills: ["deep-dive"],
    persona: "fundamental-analyst",
    prompt: "Perform a comprehensive deep dive analysis of {ticker}.",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// QUALITY_GATE constant
// ---------------------------------------------------------------------------

void test("QUALITY_GATE includes source citation requirement", () => {
  assert.ok(QUALITY_GATE.includes("cite a specific source"));
});

void test("QUALITY_GATE includes bullish-risk pairing", () => {
  assert.ok(QUALITY_GATE.includes("bullish point must be paired"));
});

void test("QUALITY_GATE includes confidence ratings", () => {
  assert.ok(QUALITY_GATE.includes("HIGH"));
  assert.ok(QUALITY_GATE.includes("MEDIUM"));
  assert.ok(QUALITY_GATE.includes("LOW"));
});

void test("QUALITY_GATE includes uniformity check", () => {
  assert.ok(QUALITY_GATE.includes("uniformly bullish or bearish"));
});

void test("QUALITY_GATE includes data tier statement", () => {
  assert.ok(QUALITY_GATE.includes("data tier"));
});

void test("QUALITY_GATE includes specificity requirement", () => {
  assert.ok(QUALITY_GATE.includes("specific to THIS"));
});

// ---------------------------------------------------------------------------
// buildCardPrompt — structure
// ---------------------------------------------------------------------------

void test("buildCardPrompt returns a string with 6 parts", () => {
  const card = makeCard();
  const prompt = buildCardPrompt(card, "NVDA");
  // Part 1 — skill reading
  assert.ok(prompt.includes("./skills/finance/deep-dive/SKILL.md"));
  // Part 2 — persona
  assert.ok(
    prompt.includes("./skills/personas/fundamental-analyst/SKILL.md"),
  );
  // Part 3 — context
  assert.ok(prompt.includes("watchlist.csv"));
  assert.ok(prompt.includes("PREFERENCES.md"));
  // Part 4 — data tier
  assert.ok(prompt.includes("best data source available"));
  // Part 5 — task-specific (ticker interpolated)
  assert.ok(prompt.includes("deep dive analysis of NVDA"));
  // Part 6 — quality gate
  assert.ok(prompt.includes("self-check"));
});

void test("buildCardPrompt interpolates {ticker} in prompt", () => {
  const card = makeCard({ prompt: "Analyze {ticker} stock." });
  const prompt = buildCardPrompt(card, "AAPL");
  assert.ok(prompt.includes("Analyze AAPL stock."));
  assert.ok(!prompt.includes("{ticker}"));
});

void test("buildCardPrompt interpolates {input} in prompt", () => {
  const card = makeCard({ prompt: "Run analysis with {input}." });
  const prompt = buildCardPrompt(card, "TSLA");
  assert.ok(prompt.includes("Run analysis with TSLA."));
  assert.ok(!prompt.includes("{input}"));
});

void test("buildCardPrompt handles card with no persona", () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { persona, ...rest } = makeCard();
  const card = rest as ActionCard;
  const prompt = buildCardPrompt(card);
  assert.ok(!prompt.includes("./skills/personas/"));
  // Other parts should still be present
  assert.ok(prompt.includes("./skills/finance/deep-dive/SKILL.md"));
  assert.ok(prompt.includes("self-check"));
});

void test("buildCardPrompt handles card with no input", () => {
  const card = makeCard({
    id: "morning-brief",
    input: "none",
    skills: ["morning-brief"],
    persona: "macro-analyst",
    prompt: "Generate a morning market briefing.",
  });
  const prompt = buildCardPrompt(card);
  assert.ok(prompt.includes("morning market briefing"));
  assert.ok(prompt.includes("./skills/finance/morning-brief/SKILL.md"));
});

void test("buildCardPrompt includes reference file instruction", () => {
  const card = makeCard();
  const prompt = buildCardPrompt(card);
  assert.ok(prompt.includes("references/"));
});

void test("buildCardPrompt handles multiple skills", () => {
  const card = makeCard({ skills: ["market-health", "morning-brief"] });
  const prompt = buildCardPrompt(card);
  assert.ok(prompt.includes("./skills/finance/market-health/SKILL.md"));
  assert.ok(prompt.includes("./skills/finance/morning-brief/SKILL.md"));
});

// ---------------------------------------------------------------------------
// buildDisplayLabel
// ---------------------------------------------------------------------------

void test("buildDisplayLabel returns card title for no-input cards", () => {
  const card = makeCard({
    id: "morning-brief",
    title: "Morning Brief",
    input: "none",
  });
  assert.equal(buildDisplayLabel(card), "Morning Brief");
});

void test("buildDisplayLabel returns title: TICKER for ticker cards", () => {
  const card = makeCard({ title: "Deep Dive" });
  assert.equal(buildDisplayLabel(card, "nvda"), "Deep Dive: NVDA");
});

void test("buildDisplayLabel uppercases ticker input", () => {
  const card = makeCard({ title: "Fair Value" });
  assert.equal(buildDisplayLabel(card, "aapl"), "Fair Value: AAPL");
});

void test("buildDisplayLabel returns just title when input is ticker but no value given", () => {
  const card = makeCard({ title: "Deep Dive" });
  assert.equal(buildDisplayLabel(card), "Deep Dive");
});

// ---------------------------------------------------------------------------
// makeUniqueLabel
// ---------------------------------------------------------------------------

void test("makeUniqueLabel returns base label when no collision", () => {
  assert.equal(makeUniqueLabel("Morning Brief", []), "Morning Brief");
});

void test("makeUniqueLabel returns base label when existing labels differ", () => {
  assert.equal(
    makeUniqueLabel("Morning Brief", ["Deep Dive: NVDA", "Market Health"]),
    "Morning Brief",
  );
});

void test("makeUniqueLabel appends (2) on first collision", () => {
  assert.equal(
    makeUniqueLabel("Morning Brief", ["Morning Brief"]),
    "Morning Brief (2)",
  );
});

void test("makeUniqueLabel appends (3) when (2) also exists", () => {
  assert.equal(
    makeUniqueLabel("Morning Brief", ["Morning Brief", "Morning Brief (2)"]),
    "Morning Brief (3)",
  );
});

void test("makeUniqueLabel works with ticker-style labels", () => {
  assert.equal(
    makeUniqueLabel("Deep Dive: NVDA", ["Deep Dive: NVDA"]),
    "Deep Dive: NVDA (2)",
  );
});

void test("makeUniqueLabel skips gaps in numbering", () => {
  assert.equal(
    makeUniqueLabel("Morning Brief", [
      "Morning Brief",
      "Morning Brief (2)",
      "Morning Brief (3)",
    ]),
    "Morning Brief (4)",
  );
});
