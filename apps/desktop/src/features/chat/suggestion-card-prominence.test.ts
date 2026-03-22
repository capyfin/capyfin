import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  MARKET_STARTER_PROMPTS,
  PORTFOLIO_STARTER_PROMPTS,
} from "./starter-prompts";

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Color property tests ---

void test("each market starter prompt has a color property", () => {
  for (const prompt of MARKET_STARTER_PROMPTS) {
    assert.ok(prompt.color, `prompt "${prompt.text}" should have a color`);
    assert.ok(prompt.color.length > 0, "color should not be empty");
  }
});

void test("each portfolio starter prompt has a color property", () => {
  for (const prompt of PORTFOLIO_STARTER_PROMPTS) {
    assert.ok(prompt.color, `prompt "${prompt.text}" should have a color`);
    assert.ok(prompt.color.length > 0, "color should not be empty");
  }
});

void test("market starter prompts use distinct accent colors", () => {
  const colors = MARKET_STARTER_PROMPTS.map((p) => p.color);
  const unique = new Set(colors);
  assert.ok(
    unique.size >= 2,
    "should use at least 2 distinct accent colors for visual variety",
  );
});

void test("portfolio starter prompts use distinct accent colors", () => {
  const colors = PORTFOLIO_STARTER_PROMPTS.map((p) => p.color);
  const unique = new Set(colors);
  assert.ok(
    unique.size >= 2,
    "should use at least 2 distinct accent colors for visual variety",
  );
});

// --- ChatWorkspace card rendering tests ---

const chatWorkspaceSrc = readFileSync(
  resolve(__dirname, "components/ChatWorkspace.tsx"),
  "utf-8",
);

void test("suggestion card icons have a visible container (~28px) larger than original 16px", () => {
  const suggestionSection = chatWorkspaceSrc.slice(
    chatWorkspaceSrc.indexOf("starterPrompts.map"),
    chatWorkspaceSrc.indexOf("starterPrompts.map") + 800,
  );
  assert.ok(
    suggestionSection.includes("size-7"),
    "Icon container must use size-7 (~28px) for increased visual weight",
  );
  assert.ok(
    suggestionSection.includes("rounded-md"),
    "Icon container must be rounded for a polished look",
  );
});

void test("suggestion cards have font-medium for bolder text", () => {
  const suggestionSection = chatWorkspaceSrc.slice(
    chatWorkspaceSrc.indexOf("starterPrompts.map"),
    chatWorkspaceSrc.indexOf("starterPrompts.map") + 500,
  );
  assert.ok(
    suggestionSection.includes("font-medium"),
    "Suggestion card text must use font-medium for increased prominence",
  );
});

void test("suggestion cards use category-tinted backgrounds", () => {
  const suggestionSection = chatWorkspaceSrc.slice(
    chatWorkspaceSrc.indexOf("starterPrompts.map"),
    chatWorkspaceSrc.indexOf("starterPrompts.map") + 500,
  );
  assert.ok(
    suggestionSection.includes("prompt.color"),
    "Suggestion cards must use per-prompt color for tinted backgrounds",
  );
});

void test("suggestion cards have hover feedback", () => {
  const suggestionSection = chatWorkspaceSrc.slice(
    chatWorkspaceSrc.indexOf("starterPrompts.map"),
    chatWorkspaceSrc.indexOf("starterPrompts.map") + 800,
  );
  assert.ok(
    suggestionSection.includes("accent.hover"),
    "Suggestion cards must include hover state styles via accent colors",
  );
});

void test("suggestion accent map contains hover classes", () => {
  assert.ok(
    chatWorkspaceSrc.includes("hover:border-amber-500"),
    "Accent map must include hover border styles",
  );
  assert.ok(
    chatWorkspaceSrc.includes("hover:bg-amber-500"),
    "Accent map must include hover background styles",
  );
});

void test("suggestion cards maintain 3-column grid layout", () => {
  assert.ok(
    chatWorkspaceSrc.includes("sm:grid-cols-3"),
    "Cards must maintain sm:grid-cols-3 layout",
  );
});
