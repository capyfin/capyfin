import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readComponent(filename: string): string {
  return readFileSync(resolve(__dirname, "components", filename), "utf-8");
}

function readFile(relativePath: string): string {
  return readFileSync(resolve(__dirname, relativePath), "utf-8");
}

// ---------------------------------------------------------------------------
// WorkflowsSection — accordion toggle state management
// ---------------------------------------------------------------------------

void test("WorkflowsSection uses useState for toggle state", () => {
  const src = readComponent("WorkflowsSection.tsx");
  assert.ok(
    src.includes("useState"),
    "WorkflowsSection must use useState for accordion toggle state",
  );
});

void test("WorkflowsSection has a button element for toggling", () => {
  const src = readComponent("WorkflowsSection.tsx");
  assert.ok(
    src.includes("<button") && src.includes('type="button"'),
    "WorkflowsSection must have a <button type='button'> for the accordion header",
  );
});

void test("WorkflowsSection button has onClick handler that toggles state", () => {
  const src = readComponent("WorkflowsSection.tsx");
  assert.ok(
    src.includes("onClick") && src.includes("setIsOpen"),
    "WorkflowsSection button must have an onClick handler that calls setIsOpen",
  );
});

void test("WorkflowsSection conditionally renders children based on open state", () => {
  const src = readComponent("WorkflowsSection.tsx");
  assert.ok(
    src.includes("isOpen") && src.includes("{children}"),
    "WorkflowsSection must conditionally render children when isOpen is true",
  );
});

void test("WorkflowsSection has chevron icons for expand/collapse indication", () => {
  const src = readComponent("WorkflowsSection.tsx");
  assert.ok(
    src.includes("ChevronDown") && src.includes("ChevronRight"),
    "WorkflowsSection must use ChevronDown (expanded) and ChevronRight (collapsed) icons",
  );
});

// ---------------------------------------------------------------------------
// Card registry — all workflow categories are populated
// ---------------------------------------------------------------------------

void test("Card registry defines all 5 workflow categories", () => {
  const src = readFile("card-registry.ts");
  const categories = ["today", "research", "setups", "income", "portfolio"];
  for (const cat of categories) {
    assert.ok(
      src.includes(`id: "${cat}"`),
      `Card registry must define category "${cat}"`,
    );
  }
});

void test("Card registry exports cardSections with all categories", () => {
  const src = readFile("card-registry.ts");
  assert.ok(
    src.includes("export const cardSections"),
    "Card registry must export cardSections",
  );
});

// ---------------------------------------------------------------------------
// LaunchpadWorkspace — WorkflowsSection integration
// ---------------------------------------------------------------------------

void test("LaunchpadWorkspace renders WorkflowsSection with resolved card sections", () => {
  const src = readComponent("LaunchpadWorkspace.tsx");
  assert.ok(
    src.includes("<WorkflowsSection>") && src.includes("resolvedSections"),
    "LaunchpadWorkspace must render WorkflowsSection with resolved card sections as children",
  );
});

void test("LaunchpadWorkspace maps card sections into CardSection components inside WorkflowsSection", () => {
  const src = readComponent("LaunchpadWorkspace.tsx");
  assert.ok(
    src.includes("<CardSection") && src.includes("section.title"),
    "LaunchpadWorkspace must render CardSection components with titles from each section",
  );
});
