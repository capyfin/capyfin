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
// LaunchpadHeroBar: compact greeting (~100px total)
// ---------------------------------------------------------------------------

void test("LaunchpadHeroBar uses compact heading size (not 32px)", () => {
  const src = readComponent("LaunchpadHeroBar.tsx");
  assert.ok(
    !src.includes("text-[32px]"),
    "Greeting heading must not use 32px — should be smaller for compact layout",
  );
});

void test("LaunchpadHeroBar uses compact vertical padding", () => {
  const src = readComponent("LaunchpadHeroBar.tsx");
  // Should NOT use py-8 (32px top+bottom = 64px padding alone)
  assert.ok(
    !src.includes("py-8"),
    "Hero bar must not use py-8 — needs compact vertical padding",
  );
});

void test("LaunchpadHeroBar does not have a separate tagline paragraph", () => {
  const src = readComponent("LaunchpadHeroBar.tsx");
  // The tagline "Your research workstation is ready" should be removed or inlined
  assert.ok(
    !src.includes("Your research workstation is ready"),
    "Standalone tagline should be removed for compact layout",
  );
});

void test("LaunchpadHeroBar quick actions row uses compact top margin", () => {
  const src = readComponent("LaunchpadHeroBar.tsx");
  // Should NOT use mt-6 (24px) before the action buttons
  assert.ok(
    !src.includes("mt-6"),
    "Quick actions row must not use mt-6 — needs tighter spacing",
  );
});

// ---------------------------------------------------------------------------
// AttentionEmptyState: banner-style, not full-screen centered
// ---------------------------------------------------------------------------

void test("AttentionEmptyState uses banner layout, not centered card", () => {
  const src = readComponent("AttentionEmptyState.tsx");
  // Should NOT use text-center + large padding (py-10)
  assert.ok(
    !src.includes("py-10"),
    "Empty state must not use py-10 — should be a compact banner",
  );
});

void test("AttentionEmptyState does not have a large centered icon ring", () => {
  const src = readComponent("AttentionEmptyState.tsx");
  // Should NOT have the large icon with ring-4 styling
  assert.ok(
    !src.includes("ring-4"),
    "Empty state must not have the large icon ring — compact banner only",
  );
});

void test("AttentionEmptyState uses horizontal flex layout", () => {
  const src = readComponent("AttentionEmptyState.tsx");
  // Should use flex + items-center for horizontal banner layout
  assert.ok(
    src.includes("flex") && src.includes("items-center"),
    "Empty state must use horizontal flex layout for compact banner",
  );
});

void test("AttentionEmptyState still has a CTA to create a case", () => {
  const src = readComponent("AttentionEmptyState.tsx");
  assert.ok(
    src.includes("Deep Dive") ||
      src.includes("deep-dive") ||
      src.includes("Create"),
    "Empty state must still have a CTA to create a case",
  );
});

// ---------------------------------------------------------------------------
// LaunchpadWorkspace: tighter section spacing
// ---------------------------------------------------------------------------

void test("LaunchpadWorkspace uses tighter section gap for above-fold content", () => {
  const src = readComponent("LaunchpadWorkspace.tsx");
  // Should NOT use gap-10 (40px) which pushes content too far down
  assert.ok(
    !src.includes("gap-10"),
    "Workspace must not use gap-10 — needs tighter spacing for above-fold",
  );
});
