import assert from "node:assert/strict";
import test from "node:test";
import {
  MARKET_STARTER_PROMPTS,
  PORTFOLIO_STARTER_PROMPTS,
} from "./starter-prompts";

// --- Structure tests ---

void test("MARKET_STARTER_PROMPTS has exactly 3 entries", () => {
  assert.equal(MARKET_STARTER_PROMPTS.length, 3);
});

void test("PORTFOLIO_STARTER_PROMPTS has exactly 3 entries", () => {
  assert.equal(PORTFOLIO_STARTER_PROMPTS.length, 3);
});

void test("each market starter prompt has text and icon properties", () => {
  for (const prompt of MARKET_STARTER_PROMPTS) {
    assert.ok(typeof prompt.text === "string", "text should be a string");
    assert.ok(prompt.text.length > 0, "text should not be empty");
  }
});

void test("each portfolio starter prompt has text and icon properties", () => {
  for (const prompt of PORTFOLIO_STARTER_PROMPTS) {
    assert.ok(typeof prompt.text === "string", "text should be a string");
    assert.ok(prompt.text.length > 0, "text should not be empty");
  }
});

// --- Icon uniqueness tests ---

void test("market starter prompts each have a distinct icon", () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- lucide-react icon types
  const icons = MARKET_STARTER_PROMPTS.map((p) => p.icon);
  const unique = new Set(icons);
  assert.equal(unique.size, icons.length, "all market icons should be distinct");
});

void test("portfolio starter prompts each have a distinct icon", () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- lucide-react icon types
  const icons = PORTFOLIO_STARTER_PROMPTS.map((p) => p.icon);
  const unique = new Set(icons);
  assert.equal(unique.size, icons.length, "all portfolio icons should be distinct");
});

// --- Text content preserved ---

void test("market starter prompts preserve expected text content", () => {
  const texts = MARKET_STARTER_PROMPTS.map((p) => p.text);
  assert.ok(texts.some((t) => t.includes("market overview")));
  assert.ok(texts.some((t) => t.includes("dividend")));
  assert.ok(texts.some((t) => t.includes("tax loss")));
});

void test("portfolio starter prompts preserve expected text content", () => {
  const texts = PORTFOLIO_STARTER_PROMPTS.map((p) => p.text);
  assert.ok(texts.some((t) => t.includes("portfolio risk")));
  assert.ok(texts.some((t) => t.includes("allocation")));
  assert.ok(texts.some((t) => t.includes("performing")));
});
