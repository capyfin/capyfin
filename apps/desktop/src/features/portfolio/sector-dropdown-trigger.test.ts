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
// Sector dropdown trigger — must use Button component for Radix compatibility
// ---------------------------------------------------------------------------

void test("HoldingsTable imports Button component from design system", () => {
  const src = readComponent("HoldingsTable.tsx");
  assert.ok(
    src.includes("import") &&
      src.includes("Button") &&
      src.includes("@/components/ui/button"),
    "HoldingsTable must import the Button component from @/components/ui/button",
  );
});

void test("HoldingsTable uses Button inside DropdownMenuTrigger for sector editing", () => {
  const src = readComponent("HoldingsTable.tsx");
  // The trigger should use Button component, not a native <button> element
  // Search for JSX usage (<DropdownMenuTrigger), not the import
  const triggerIdx = src.indexOf("<DropdownMenuTrigger");
  assert.ok(triggerIdx > -1, "Should have a <DropdownMenuTrigger in JSX");
  const triggerSection = src.slice(triggerIdx, triggerIdx + 500);
  assert.ok(
    triggerSection.includes("<Button"),
    "DropdownMenuTrigger should wrap a <Button> component, not a native <button> element",
  );
});

void test("Sector trigger Button uses ghost variant for transparent background", () => {
  const src = readComponent("HoldingsTable.tsx");
  // Find the sector trigger Button and verify it uses ghost variant
  const triggerIdx = src.indexOf("<DropdownMenuTrigger");
  assert.ok(triggerIdx > -1, "Should have a <DropdownMenuTrigger in JSX");
  const triggerSection = src.slice(triggerIdx, triggerIdx + 500);
  assert.ok(
    triggerSection.includes('variant="ghost"') ||
      triggerSection.includes("variant={'ghost'}"),
    "Sector trigger Button should use ghost variant for transparent background",
  );
});

void test("Sector dropdown still shows 'Not set' for holdings without sector", () => {
  const src = readComponent("HoldingsTable.tsx");
  assert.ok(
    src.includes("Not set"),
    "Sector dropdown should show 'Not set' for unset sectors",
  );
});

void test("Sector dropdown shows pencil icon for edit affordance", () => {
  const src = readComponent("HoldingsTable.tsx");
  assert.ok(
    src.includes("PencilIcon"),
    "Sector dropdown trigger should include a PencilIcon for edit affordance",
  );
});

void test("Sector dropdown calls onSectorChange when item selected", () => {
  const src = readComponent("HoldingsTable.tsx");
  // DropdownMenuItem onSelect should invoke onSectorChange
  const menuContentIdx = src.indexOf("<DropdownMenuContent");
  assert.ok(menuContentIdx > -1, "Should have a <DropdownMenuContent in JSX");
  const menuSection = src.slice(menuContentIdx, menuContentIdx + 600);
  assert.ok(
    menuSection.includes("onSectorChange"),
    "DropdownMenuItem onSelect should call onSectorChange callback",
  );
});

void test("Sector dropdown displays check icon for currently selected sector", () => {
  const src = readComponent("HoldingsTable.tsx");
  assert.ok(
    src.includes("CheckIcon") && src.includes("holding.sector === sector"),
    "Should show CheckIcon next to the currently selected sector",
  );
});
