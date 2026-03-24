import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { actionCards, portfolioCards, incomeCards } from "./card-registry";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readComponent(filename: string): string {
  return readFileSync(resolve(__dirname, "components", filename), "utf-8");
}

// ---------------------------------------------------------------------------
// Type contract — estimatedDuration field
// ---------------------------------------------------------------------------

void test("ActionCard type includes estimatedDuration field", () => {
  const src = readFileSync(resolve(__dirname, "types.ts"), "utf-8");
  assert.ok(
    src.includes("estimatedDuration"),
    "ActionCard interface must define estimatedDuration field",
  );
});

// ---------------------------------------------------------------------------
// Card registry — every card has estimatedDuration
// ---------------------------------------------------------------------------

void test("every action card defines estimatedDuration", () => {
  for (const card of actionCards) {
    assert.ok(
      card.estimatedDuration,
      `card ${card.id} missing estimatedDuration`,
    );
  }
});

void test("every portfolio card defines estimatedDuration", () => {
  for (const card of portfolioCards) {
    assert.ok(
      card.estimatedDuration,
      `card ${card.id} missing estimatedDuration`,
    );
  }
});

void test("every income card defines estimatedDuration", () => {
  for (const card of incomeCards) {
    assert.ok(
      card.estimatedDuration,
      `card ${card.id} missing estimatedDuration`,
    );
  }
});

void test("estimatedDuration values are valid durations", () => {
  const allCards = [...actionCards, ...portfolioCards, ...incomeCards];
  const validDurations = ["fast", "medium", "deep"];
  for (const card of allCards) {
    assert.ok(
      validDurations.includes(card.estimatedDuration as string),
      `card ${card.id} has invalid estimatedDuration: ${card.estimatedDuration}`,
    );
  }
});

// ---------------------------------------------------------------------------
// ActionCardItem — metadata row rendering
// ---------------------------------------------------------------------------

void test("ActionCardItem renders a metadata row element", () => {
  const src = readComponent("ActionCardItem.tsx");
  assert.ok(
    src.includes("metadata"),
    "ActionCardItem must render a metadata row",
  );
});

void test("ActionCardItem displays human-readable input labels", () => {
  const src = readComponent("ActionCardItem.tsx");
  // Must map input enum to human-readable text
  assert.ok(
    src.includes("No input") || src.includes("inputLabel"),
    "ActionCardItem must display human-readable input type labels",
  );
});

void test("ActionCardItem displays duration badge", () => {
  const src = readComponent("ActionCardItem.tsx");
  assert.ok(
    src.includes("estimatedDuration") || src.includes("durationLabel"),
    "ActionCardItem must display estimated duration",
  );
});

void test("metadata row uses subdued styling", () => {
  const src = readComponent("ActionCardItem.tsx");
  // metadata row should use muted/smaller text
  assert.ok(
    src.includes("text-muted-foreground") || src.includes("text-xs"),
    "Metadata row should use subdued text styling",
  );
});

// ---------------------------------------------------------------------------
// Input label mapping covers all input modes
// ---------------------------------------------------------------------------

void test("input label mapping covers all CardInputMode values", () => {
  const src = readFileSync(
    resolve(__dirname, "components", "ActionCardItem.tsx"),
    "utf-8",
  );
  // Must handle all five input modes
  for (const mode of ["none", "ticker", "tickers", "preferences", "upload"]) {
    assert.ok(
      src.includes(mode),
      `ActionCardItem must handle input mode "${mode}"`,
    );
  }
});

// ---------------------------------------------------------------------------
// Schedulable cards — Market Health
// ---------------------------------------------------------------------------

void test("market-health card has schedulable flag set to true", () => {
  const marketHealth = actionCards.find((c) => c.id === "market-health");
  assert.ok(marketHealth, "market-health card must exist in actionCards");
  assert.equal(
    marketHealth.schedulable,
    true,
    "market-health card must be schedulable",
  );
});

void test("schedulable cards include both morning-brief and market-health", () => {
  const schedulable = actionCards.filter((c) => c.schedulable);
  const ids = schedulable.map((c) => c.id);
  assert.ok(ids.includes("morning-brief"), "morning-brief must be schedulable");
  assert.ok(ids.includes("market-health"), "market-health must be schedulable");
});

void test("market-health card has input none (no additional config needed)", () => {
  const marketHealth = actionCards.find((c) => c.id === "market-health");
  assert.ok(marketHealth, "market-health card must exist");
  assert.equal(
    marketHealth.input,
    "none",
    "market-health should require no input",
  );
});
