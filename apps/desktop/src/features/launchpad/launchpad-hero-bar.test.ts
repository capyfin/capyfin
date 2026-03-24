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
// LaunchpadHeroBar component exists
// ---------------------------------------------------------------------------

void test("LaunchpadHeroBar component file exists", () => {
  const src = readComponent("LaunchpadHeroBar.tsx");
  assert.ok(src.length > 0, "LaunchpadHeroBar.tsx must exist and not be empty");
});

// ---------------------------------------------------------------------------
// Greeting with date
// ---------------------------------------------------------------------------

void test("LaunchpadHeroBar renders a greeting based on time of day", () => {
  const src = readComponent("LaunchpadHeroBar.tsx");
  assert.ok(
    src.includes("Good morning") &&
      src.includes("Good afternoon") &&
      src.includes("Good evening"),
    "Hero bar must include time-of-day greetings (morning, afternoon, evening)",
  );
});

void test("LaunchpadHeroBar formats and displays the current date", () => {
  const src = readComponent("LaunchpadHeroBar.tsx");
  // Must use toLocaleDateString or Intl.DateTimeFormat to format the date
  assert.ok(
    src.includes("toLocaleDateString") ||
      src.includes("DateTimeFormat") ||
      src.includes("weekday"),
    "Hero bar must format the current date for display",
  );
});

// ---------------------------------------------------------------------------
// Market summary area
// ---------------------------------------------------------------------------

void test("LaunchpadHeroBar includes a market summary area", () => {
  const src = readComponent("LaunchpadHeroBar.tsx");
  assert.ok(
    src.includes("market") || src.includes("Market"),
    "Hero bar must include a market summary area",
  );
});

void test("LaunchpadHeroBar shows placeholder text when no data provider is connected", () => {
  const src = readComponent("LaunchpadHeroBar.tsx");
  assert.ok(
    src.includes("data provider") || src.includes("placeholder"),
    "Hero bar must show placeholder text for market summary",
  );
});

// ---------------------------------------------------------------------------
// Quick action buttons
// ---------------------------------------------------------------------------

void test("LaunchpadHeroBar has Morning Brief quick action", () => {
  const src = readComponent("LaunchpadHeroBar.tsx");
  assert.ok(
    src.includes("Morning Brief") || src.includes("morning-brief"),
    "Hero bar must have a Morning Brief quick action button",
  );
});

void test("LaunchpadHeroBar has Deep Dive quick action", () => {
  const src = readComponent("LaunchpadHeroBar.tsx");
  assert.ok(
    src.includes("Deep Dive") || src.includes("deep-dive"),
    "Hero bar must have a Deep Dive quick action button",
  );
});

void test("LaunchpadHeroBar has Add to Watchlist quick action", () => {
  const src = readComponent("LaunchpadHeroBar.tsx");
  assert.ok(
    src.includes("Watchlist") || src.includes("watchlist"),
    "Hero bar must have an Add to Watchlist quick action button",
  );
});

void test("Quick action buttons have click handlers", () => {
  const src = readComponent("LaunchpadHeroBar.tsx");
  assert.ok(
    src.includes("onClick"),
    "Quick action buttons must have onClick handlers",
  );
});

// ---------------------------------------------------------------------------
// Search/command input
// ---------------------------------------------------------------------------

void test("LaunchpadHeroBar includes a search input", () => {
  const src = readComponent("LaunchpadHeroBar.tsx");
  assert.ok(
    src.includes("Search") || src.includes("search") || src.includes("⌘K"),
    "Hero bar must include a search/command input",
  );
});

void test("Search input triggers command palette", () => {
  const src = readComponent("LaunchpadHeroBar.tsx");
  assert.ok(
    src.includes("onOpenCommandPalette") || src.includes("commandPalette"),
    "Search input must trigger the command palette",
  );
});

// ---------------------------------------------------------------------------
// LaunchpadWorkspace integration
// ---------------------------------------------------------------------------

void test("LaunchpadWorkspace imports and renders LaunchpadHeroBar", () => {
  const src = readComponent("LaunchpadWorkspace.tsx");
  assert.ok(
    src.includes("LaunchpadHeroBar"),
    "LaunchpadWorkspace must import and render LaunchpadHeroBar",
  );
});

void test("LaunchpadWorkspace passes onOpenCommandPalette to hero bar", () => {
  const src = readComponent("LaunchpadWorkspace.tsx");
  assert.ok(
    src.includes("onOpenCommandPalette"),
    "LaunchpadWorkspace must accept and pass onOpenCommandPalette prop",
  );
});

// ---------------------------------------------------------------------------
// Hero bar styling
// ---------------------------------------------------------------------------

void test("LaunchpadHeroBar uses gradient styling consistent with the design system", () => {
  const src = readComponent("LaunchpadHeroBar.tsx");
  assert.ok(
    src.includes("gradient") || src.includes("bg-gradient"),
    "Hero bar must use gradient background styling",
  );
});

void test("LaunchpadHeroBar uses rounded card styling", () => {
  const src = readComponent("LaunchpadHeroBar.tsx");
  assert.ok(
    src.includes("rounded-2xl") || src.includes("rounded-xl"),
    "Hero bar must use rounded card styling",
  );
});
