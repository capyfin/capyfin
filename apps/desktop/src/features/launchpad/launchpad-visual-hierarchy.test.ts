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
// Visual hierarchy — "Today" cards have subtle filled bg, "Research" cards don't
// ---------------------------------------------------------------------------

void test("ActionCardItem applies bg-primary fill for today-category cards", () => {
  const src = readComponent("ActionCardItem.tsx");

  // The component must check card.category and apply a filled background for "today"
  assert.ok(
    src.includes("card.category"),
    "ActionCardItem must read card.category to differentiate styling",
  );

  // Must include the subtle primary fill class for today cards
  assert.ok(
    src.includes("bg-primary/"),
    "ActionCardItem must apply a bg-primary fill for today-category cards",
  );
});

void test("ActionCardItem uses dark mode variant for today-category fill", () => {
  const src = readComponent("ActionCardItem.tsx");

  // Must include dark mode variant for the filled background
  assert.ok(
    src.includes("dark:bg-primary/"),
    "ActionCardItem must include a dark: variant for the today-category fill",
  );
});

void test("today and research cards have different visual treatment", () => {
  const src = readComponent("ActionCardItem.tsx");

  // The conditional styling must use card.category === "today" or similar
  assert.match(
    src,
    /category\s*===?\s*["']today["']/,
    "Styling must be conditional on category being 'today'",
  );
});

void test("cards within each section remain visually equal", () => {
  const src = readComponent("ActionCardItem.tsx");

  // Styling must NOT reference specific card IDs — only category
  assert.ok(
    !src.includes('"morning-brief"'),
    "Styling should use category, not individual card IDs — morning-brief found",
  );
  assert.ok(
    !src.includes('"market-health"'),
    "Styling should use category, not individual card IDs — market-health found",
  );
  assert.ok(
    !src.includes('"deep-dive"'),
    "Styling should use category, not individual card IDs — deep-dive found",
  );
  assert.ok(
    !src.includes('"fair-value"'),
    "Styling should use category, not individual card IDs — fair-value found",
  );
});
