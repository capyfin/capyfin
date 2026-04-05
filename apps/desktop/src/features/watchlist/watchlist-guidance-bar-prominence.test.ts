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
// AC1: Guidance bar uses a Card-like container with subtle gradient background
// ---------------------------------------------------------------------------

void test("Guidance bar uses gradient background instead of dashed border", () => {
  const src = readComponent("WatchlistWorkspace.tsx");

  // The guidance section should use a gradient background
  // Find the guidance rendering area (where getFilterGuidance is called)
  const guidanceArea = src.slice(src.indexOf("getFilterGuidance"));
  assert.ok(guidanceArea, "Must have getFilterGuidance call");

  // Should NOT have border-dashed
  assert.ok(
    !guidanceArea.includes("border-dashed"),
    "Guidance bar must not use dashed border styling",
  );

  // Should have a gradient background
  assert.match(
    guidanceArea,
    /bg-gradient/,
    "Guidance bar must use a gradient background",
  );
});

void test("Guidance bar uses rounded-xl and solid border treatment", () => {
  const src = readComponent("WatchlistWorkspace.tsx");
  const guidanceArea = src.slice(src.indexOf("getFilterGuidance"));

  assert.match(
    guidanceArea,
    /rounded-xl/,
    "Guidance bar must use rounded-xl for card-like appearance",
  );

  assert.match(guidanceArea, /border/, "Guidance bar must have a border");
});

// ---------------------------------------------------------------------------
// AC2: Text is readable (not nearly-invisible muted text)
// ---------------------------------------------------------------------------

void test("Guidance text uses readable text color without heavy opacity reduction", () => {
  const src = readComponent("WatchlistWorkspace.tsx");
  const guidanceArea = src.slice(src.indexOf("getFilterGuidance"));

  // Should NOT have text-muted-foreground/60 or /40 or /50 (too faint)
  assert.ok(
    !guidanceArea.includes("text-muted-foreground/60"),
    "Guidance text must not use /60 opacity (too faint)",
  );
  assert.ok(
    !guidanceArea.includes("text-muted-foreground/40"),
    "Guidance text must not use /40 opacity (too faint)",
  );
  assert.ok(
    !guidanceArea.includes("text-muted-foreground/50"),
    "Guidance text must not use /50 opacity (too faint)",
  );
});

void test("Guidance text uses at least text-[13px] size", () => {
  const src = readComponent("WatchlistWorkspace.tsx");
  const guidanceArea = src.slice(src.indexOf("getFilterGuidance"));

  // Should have text-[13px] or text-sm (14px) or larger
  assert.match(
    guidanceArea,
    /text-\[1[3-9]px\]|text-sm|text-base/,
    "Guidance text must use at least text-[13px] for readability",
  );
});

// ---------------------------------------------------------------------------
// AC3: An icon draws attention to the guidance
// ---------------------------------------------------------------------------

void test("Guidance bar includes a Lightbulb icon for attention", () => {
  const src = readComponent("WatchlistWorkspace.tsx");

  // Should import LightbulbIcon from lucide-react
  assert.match(
    src,
    /LightbulbIcon/,
    "Must use LightbulbIcon to draw attention to guidance",
  );

  // The icon should be in the guidance area
  const guidanceArea = src.slice(src.indexOf("getFilterGuidance"));
  assert.match(
    guidanceArea,
    /LightbulbIcon/,
    "LightbulbIcon must be rendered in the guidance bar area",
  );
});

// ---------------------------------------------------------------------------
// AC4: Guidance text is visible without straining at normal viewing distance
// ---------------------------------------------------------------------------

void test("Guidance bar icon container uses visible background color", () => {
  const src = readComponent("WatchlistWorkspace.tsx");
  const guidanceArea = src.slice(src.indexOf("getFilterGuidance"));

  // The icon container should have a visible background (not /[0.06] which is nearly invisible)
  // Should use something like amber-500/10 or amber-500/15 or similar visible tone
  assert.match(
    guidanceArea,
    /bg-amber|bg-blue|bg-primary/,
    "Icon container must have a visible accent background color",
  );
});

// ---------------------------------------------------------------------------
// AC5: Guidance bar fills some empty space below table
// ---------------------------------------------------------------------------

void test("Guidance bar has adequate padding for visual presence", () => {
  const src = readComponent("WatchlistWorkspace.tsx");
  const guidanceArea = src.slice(src.indexOf("getFilterGuidance"));

  // Should have px-5 or similar horizontal padding and py-4 or similar vertical padding
  assert.match(
    guidanceArea,
    /px-[45]/,
    "Guidance bar must have adequate horizontal padding",
  );
  assert.match(
    guidanceArea,
    /py-[34]/,
    "Guidance bar must have adequate vertical padding",
  );
});

// ---------------------------------------------------------------------------
// AC6: Existing watchlist tests still pass (verified by running the test suite)
// ---------------------------------------------------------------------------

void test("WatchlistWorkspace still exports guidance-related constants", async () => {
  const mod = await import("./components/WatchlistWorkspace");
  assert.ok(typeof mod.WATCHLIST_EMPTY_TEXT === "string");
  assert.ok(mod.WATCHLIST_EMPTY_TEXT.length > 0);
  assert.ok(typeof mod.WATCHLIST_NEAR_EMPTY_TEXT === "string");
  assert.ok(mod.WATCHLIST_NEAR_EMPTY_TEXT.length > 0);
  assert.equal(mod.WATCHLIST_NEAR_EMPTY_THRESHOLD, 5);
});
