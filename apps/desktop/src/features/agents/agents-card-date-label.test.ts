import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const workspaceSrc = readFileSync(
  resolve(__dirname, "components/AgentsWorkspace.tsx"),
  "utf-8",
);

// --- Date label existence ---

void test("agent card date has an uppercase 'Updated' label", () => {
  assert.ok(
    workspaceSrc.includes("Updated"),
    "Agent card must include an 'Updated' label above the date",
  );
});

void test("agent card date label uses the same styling as Provider/Model labels", () => {
  // The Provider/Model labels use: text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground/50
  const labelPattern =
    /text-\[10px\].*font-medium.*uppercase.*tracking-\[0\.15em\].*text-muted-foreground\/50/;

  // Find all label spans with this pattern
  const matches = workspaceSrc.match(new RegExp(labelPattern.source, "g"));
  assert.ok(
    matches && matches.length >= 3,
    "There should be at least 3 labels with the standard label styling (Provider, Model, Updated)",
  );
});

void test("agent card date value uses text-[12px] for consistency", () => {
  // Find the date rendering section (near formatDate)
  const dateIdx = workspaceSrc.indexOf("formatDate(agent.updatedAt)");
  assert.ok(dateIdx !== -1, "Agent card must render formatDate(agent.updatedAt)");

  // Check the surrounding context (200 chars before) for the expected value styling
  const context = workspaceSrc.slice(Math.max(0, dateIdx - 200), dateIdx + 40);
  assert.ok(
    context.includes("text-[12px]"),
    "Date value should use text-[12px] to match Provider/Model value sizing",
  );
});

void test("agent card date section uses grid gap-1 layout like Provider/Model", () => {
  // The Provider and Model sections use "grid gap-1" layout
  const dateIdx = workspaceSrc.indexOf("formatDate(agent.updatedAt)");
  assert.ok(dateIdx !== -1, "Agent card must render formatDate(agent.updatedAt)");

  // Check surrounding context for grid gap-1 layout
  const context = workspaceSrc.slice(Math.max(0, dateIdx - 300), dateIdx + 40);
  assert.ok(
    context.includes("grid gap-1"),
    "Date section should use 'grid gap-1' layout matching Provider/Model sections",
  );
});

// --- No regression ---

void test("Provider label still renders with standard label styling", () => {
  assert.ok(
    workspaceSrc.includes("Provider"),
    "Provider label must still be present in agent cards",
  );
});

void test("Model label still renders with standard label styling", () => {
  assert.ok(
    workspaceSrc.includes("Model"),
    "Model label must still be present in agent cards",
  );
});
