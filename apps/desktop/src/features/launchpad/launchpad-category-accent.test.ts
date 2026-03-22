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
// Category-specific accent colors for icon containers
// ---------------------------------------------------------------------------

void test("ActionCardItem defines a categoryAccent mapping with today, research, and setups", () => {
  const src = readComponent("ActionCardItem.tsx");

  assert.ok(
    src.includes("categoryAccent"),
    "ActionCardItem must define a categoryAccent mapping",
  );

  // Must have entries for all three categories
  assert.match(src, /today/, "categoryAccent must include 'today' category");
  assert.match(
    src,
    /research/,
    "categoryAccent must include 'research' category",
  );
  assert.match(src, /setups/, "categoryAccent must include 'setups' category");
});

void test("today category uses amber accent color", () => {
  const src = readComponent("ActionCardItem.tsx");

  assert.ok(
    src.includes("amber"),
    "today category must use amber color for icons",
  );
});

void test("research category uses blue accent color", () => {
  const src = readComponent("ActionCardItem.tsx");

  assert.ok(
    src.includes("blue"),
    "research category must use blue color for icons",
  );
});

void test("setups category uses emerald accent color", () => {
  const src = readComponent("ActionCardItem.tsx");

  assert.ok(
    src.includes("emerald"),
    "setups category must use emerald color for icons",
  );
});

void test("icon container uses category accent instead of static primary color", () => {
  const src = readComponent("ActionCardItem.tsx");

  // The icon container div should NOT use the old static primary color classes
  // for the icon background/fill — it should use the accent mapping
  assert.ok(
    !src.includes(
      'className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary"',
    ),
    "Icon container must not use static bg-primary/8 text-primary — should use category accent",
  );
});

void test("each category has distinct icon colors", () => {
  const src = readComponent("ActionCardItem.tsx");

  // Extract the color classes for each category
  const amberBg = src.includes("bg-amber-500");
  const blueBg = src.includes("bg-blue-500");
  const emeraldBg = src.includes("bg-emerald-500");

  assert.ok(amberBg, "today category should use bg-amber-500 variant");
  assert.ok(blueBg, "research category should use bg-blue-500 variant");
  assert.ok(emeraldBg, "setups category should use bg-emerald-500 variant");
});

void test("accent colors use category from card, not hardcoded card IDs", () => {
  const src = readComponent("ActionCardItem.tsx");

  // Accent lookup should use card.category, not specific card IDs
  assert.ok(
    src.includes("card.category"),
    "Accent color lookup must use card.category",
  );

  // Should NOT hardcode individual card IDs for color selection
  assert.ok(
    !src.includes('"morning-brief"'),
    "Must not reference individual card ID morning-brief for accent colors",
  );
  assert.ok(
    !src.includes('"deep-dive"'),
    "Must not reference individual card ID deep-dive for accent colors",
  );
});
