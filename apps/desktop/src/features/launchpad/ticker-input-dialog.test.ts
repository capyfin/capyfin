import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readComponent(filename: string): string {
  return readFileSync(resolve(__dirname, "components", filename), "utf-8");
}

// ---------------------------------------------------------------------------
// TickerInputDialog — standalone ticker input component
// ---------------------------------------------------------------------------

void test("TickerInputDialog component exists", () => {
  const src = readComponent("TickerInputDialog.tsx");
  assert.ok(
    src.length > 0,
    "TickerInputDialog.tsx must exist and not be empty",
  );
});

void test("TickerInputDialog uses Dialog primitives from the UI library", () => {
  const src = readComponent("TickerInputDialog.tsx");
  assert.ok(
    src.includes("Dialog") && src.includes("DialogContent"),
    "TickerInputDialog must use Dialog and DialogContent from the UI library",
  );
});

void test("TickerInputDialog accepts card, open, onOpenChange, and onSubmit props", () => {
  const src = readComponent("TickerInputDialog.tsx");
  assert.ok(
    src.includes("card") &&
      src.includes("open") &&
      src.includes("onOpenChange") &&
      src.includes("onSubmit"),
    "TickerInputDialog must accept card, open, onOpenChange, and onSubmit props",
  );
});

void test("TickerInputDialog has a ticker input field", () => {
  const src = readComponent("TickerInputDialog.tsx");
  assert.ok(
    src.includes("<Input") || src.includes("<input"),
    "TickerInputDialog must have a ticker input field",
  );
});

void test("TickerInputDialog has a submit button", () => {
  const src = readComponent("TickerInputDialog.tsx");
  assert.ok(
    src.includes("submit") ||
      src.includes("Submit") ||
      src.includes('type="submit"'),
    "TickerInputDialog must have a submit button",
  );
});

void test("TickerInputDialog displays the card title", () => {
  const src = readComponent("TickerInputDialog.tsx");
  assert.ok(
    src.includes("card.title") || src.includes("card?.title"),
    "TickerInputDialog must display the card title",
  );
});

void test("TickerInputDialog calls onSubmit with card and ticker value", () => {
  const src = readComponent("TickerInputDialog.tsx");
  assert.ok(
    src.includes("onSubmit") && src.includes("card"),
    "TickerInputDialog must call onSubmit with the card and ticker value",
  );
});

void test("TickerInputDialog resets state when closed", () => {
  const src = readComponent("TickerInputDialog.tsx");
  assert.ok(
    src.includes('setTicker("")') || src.includes("setTicker('')"),
    "TickerInputDialog must reset ticker state when closed",
  );
});

// ---------------------------------------------------------------------------
// Entry points no longer use document.querySelector for card DOM lookup
// ---------------------------------------------------------------------------

void test("QuickActions does not use document.querySelector for card lookup", () => {
  const src = readComponent("QuickActions.tsx");
  assert.ok(
    !src.includes("document.querySelector"),
    "QuickActions must not use document.querySelector — use TickerInputDialog instead",
  );
});

void test("LaunchpadHeroBar does not use document.querySelector for card lookup", () => {
  const src = readComponent("LaunchpadHeroBar.tsx");
  assert.ok(
    !src.includes("document.querySelector"),
    "LaunchpadHeroBar must not use document.querySelector — use TickerInputDialog instead",
  );
});

void test("AttentionEmptyState does not use document.querySelector for card lookup", () => {
  const src = readComponent("AttentionEmptyState.tsx");
  assert.ok(
    !src.includes("document.querySelector"),
    "AttentionEmptyState must not use document.querySelector — use TickerInputDialog instead",
  );
});

void test("SuggestionsSection does not use document.querySelector for card lookup", () => {
  const src = readComponent("SuggestionsSection.tsx");
  assert.ok(
    !src.includes("document.querySelector"),
    "SuggestionsSection must not use document.querySelector — use TickerInputDialog instead",
  );
});

// ---------------------------------------------------------------------------
// Entry points use TickerInputDialog for cards that need input
// ---------------------------------------------------------------------------

void test("QuickActions renders TickerInputDialog", () => {
  const src = readComponent("QuickActions.tsx");
  assert.ok(
    src.includes("TickerInputDialog"),
    "QuickActions must render TickerInputDialog for cards that need input",
  );
});

void test("LaunchpadHeroBar renders TickerInputDialog", () => {
  const src = readComponent("LaunchpadHeroBar.tsx");
  assert.ok(
    src.includes("TickerInputDialog"),
    "LaunchpadHeroBar must render TickerInputDialog for cards that need input",
  );
});

void test("AttentionEmptyState renders TickerInputDialog", () => {
  const src = readComponent("AttentionEmptyState.tsx");
  assert.ok(
    src.includes("TickerInputDialog"),
    "AttentionEmptyState must render TickerInputDialog for cards that need input",
  );
});

void test("SuggestionsSection renders TickerInputDialog", () => {
  const src = readComponent("SuggestionsSection.tsx");
  assert.ok(
    src.includes("TickerInputDialog"),
    "SuggestionsSection must render TickerInputDialog for cards that need input",
  );
});

// ---------------------------------------------------------------------------
// Entry points manage pendingCard state for the dialog
// ---------------------------------------------------------------------------

void test("QuickActions manages pendingCard state for dialog", () => {
  const src = readComponent("QuickActions.tsx");
  assert.ok(
    src.includes("pendingCard") && src.includes("setPendingCard"),
    "QuickActions must manage pendingCard state for the TickerInputDialog",
  );
});

void test("LaunchpadHeroBar manages pendingCard state for dialog", () => {
  const src = readComponent("LaunchpadHeroBar.tsx");
  assert.ok(
    src.includes("pendingCard") && src.includes("setPendingCard"),
    "LaunchpadHeroBar must manage pendingCard state for the TickerInputDialog",
  );
});

void test("QuickActions calls onCardClick directly for cards with no input", () => {
  const src = readComponent("QuickActions.tsx");
  assert.ok(
    src.includes('card.input === "none"') && src.includes("onCardClick"),
    "QuickActions must call onCardClick directly for cards with input=none",
  );
});
