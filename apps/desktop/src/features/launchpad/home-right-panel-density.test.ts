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
// AC1: RECENT ACTIVITY shows at most 3 items
// ---------------------------------------------------------------------------

void test("RecentActivitySection limits items to 3", () => {
  const src = readComponent("RecentActivitySection.tsx");
  assert.ok(
    src.includes("MAX_ITEMS = 3"),
    "MAX_ITEMS must be set to 3 to limit recent activity entries",
  );
});

// ---------------------------------------------------------------------------
// AC2: No raw session IDs or hex strings appear as session names
// ---------------------------------------------------------------------------

void test("RecentActivitySection sanitizes hex session IDs", () => {
  const src = readComponent("RecentActivitySection.tsx");
  // Should have logic to detect hex-like sessionKey values and replace with fallback
  assert.ok(
    src.includes("isHexLike") ||
      src.includes("sanitizeSessionLabel") ||
      src.includes("/^[0-9a-f"),
    "Must include logic to detect and replace raw hex session IDs",
  );
});

void test("RecentActivitySection provides a fallback label for hex sessions", () => {
  const src = readComponent("RecentActivitySection.tsx");
  assert.ok(
    src.includes("Chat session"),
    "Must provide a 'Chat session' fallback label for hex/UUID session names",
  );
});

// ---------------------------------------------------------------------------
// AC3: Right panel sections have tighter spacing
// ---------------------------------------------------------------------------

void test("RecentActivitySection uses tight heading-to-content spacing", () => {
  const src = readComponent("RecentActivitySection.tsx");
  assert.ok(
    src.includes("space-y-2") || src.includes("gap-2"),
    "Section must use tighter spacing (space-y-2 or gap-2) between heading and content",
  );
  assert.ok(
    !src.includes("space-y-4"),
    "Section must NOT use space-y-4 — that creates too much gap",
  );
});

void test("LaunchpadWorkspace uses tight spacing between right panel sections", () => {
  const src = readComponent("LaunchpadWorkspace.tsx");
  // Find JSX usage (with angle bracket), not the import statement
  const recentIdx = src.indexOf("<RecentActivitySection");
  const suggestIdx = src.indexOf("<SuggestionsSection");
  // Check that the sections exist in JSX
  assert.ok(
    recentIdx > 0,
    "RecentActivitySection must be rendered in LaunchpadWorkspace",
  );
  assert.ok(
    suggestIdx > 0,
    "SuggestionsSection must be rendered in LaunchpadWorkspace",
  );
  // Verify mt-2 is used near these sections (within ~200 chars before the JSX tag)
  const recentContext = src.slice(Math.max(0, recentIdx - 200), recentIdx);
  const suggestContext = src.slice(Math.max(0, suggestIdx - 200), suggestIdx);
  assert.ok(
    recentContext.includes("mt-2"),
    "RecentActivitySection wrapper must use mt-2 for tighter spacing",
  );
  assert.ok(
    suggestContext.includes("mt-2"),
    "SuggestionsSection wrapper must use mt-2 for tighter spacing",
  );
});

// ---------------------------------------------------------------------------
// AC4: "View all" link appears if more than 3 sessions
// ---------------------------------------------------------------------------

void test("RecentActivitySection shows a 'View all' link", () => {
  const src = readComponent("RecentActivitySection.tsx");
  assert.ok(
    src.includes("View all") || src.includes("See all"),
    "Must include a 'View all' or 'See all' link when there are more sessions",
  );
});

void test("RecentActivitySection 'View all' link navigates to Chat", () => {
  const src = readComponent("RecentActivitySection.tsx");
  assert.ok(
    src.includes("#chat"),
    "The 'View all' link must point to the Chat page (#chat)",
  );
});

void test("RecentActivitySection conditionally shows 'View all' based on session count", () => {
  const src = readComponent("RecentActivitySection.tsx");
  assert.ok(
    src.includes("sessions.length > MAX_ITEMS") ||
      src.includes("sessions.length > 3"),
    "Must conditionally show 'View all' only when there are more sessions than MAX_ITEMS",
  );
});
