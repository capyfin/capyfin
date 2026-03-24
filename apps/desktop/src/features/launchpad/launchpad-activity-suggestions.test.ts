import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readComponent(filename: string): string {
  return readFileSync(resolve(__dirname, "components", filename), "utf-8");
}

function readFile(filename: string): string {
  return readFileSync(resolve(__dirname, filename), "utf-8");
}

// ---------------------------------------------------------------------------
// RecentActivitySection component exists
// ---------------------------------------------------------------------------

void test("RecentActivitySection component file exists", () => {
  const src = readComponent("RecentActivitySection.tsx");
  assert.ok(
    src.length > 0,
    "RecentActivitySection.tsx must exist and not be empty",
  );
});

// ---------------------------------------------------------------------------
// RecentActivitySection displays recent activity heading
// ---------------------------------------------------------------------------

void test("RecentActivitySection renders a 'Recent Activity' heading", () => {
  const src = readComponent("RecentActivitySection.tsx");
  assert.ok(
    src.includes("Recent Activity"),
    "Must include 'Recent Activity' heading text",
  );
});

// ---------------------------------------------------------------------------
// RecentActivitySection shows session items
// ---------------------------------------------------------------------------

void test("RecentActivitySection renders session labels", () => {
  const src = readComponent("RecentActivitySection.tsx");
  assert.ok(
    src.includes("label") || src.includes("session"),
    "Must render session data (label or session references)",
  );
});

// ---------------------------------------------------------------------------
// RecentActivitySection limits items to 5
// ---------------------------------------------------------------------------

void test("RecentActivitySection limits displayed items", () => {
  const src = readComponent("RecentActivitySection.tsx");
  assert.ok(
    src.includes("slice") || src.includes("5"),
    "Must limit the number of recent activity items displayed",
  );
});

// ---------------------------------------------------------------------------
// RecentActivitySection handles empty state
// ---------------------------------------------------------------------------

void test("RecentActivitySection shows empty state when no sessions exist", () => {
  const src = readComponent("RecentActivitySection.tsx");
  assert.ok(
    src.includes("No recent activity") || src.includes("no activity"),
    "Must show an empty state message when there are no sessions",
  );
});

// ---------------------------------------------------------------------------
// RecentActivitySection items are clickable
// ---------------------------------------------------------------------------

void test("RecentActivitySection items have click handlers", () => {
  const src = readComponent("RecentActivitySection.tsx");
  assert.ok(
    src.includes("onClick") || src.includes("onSessionSelect"),
    "Recent activity items must be clickable",
  );
});

// ---------------------------------------------------------------------------
// RecentActivitySection shows relative time
// ---------------------------------------------------------------------------

void test("RecentActivitySection shows relative timestamps", () => {
  const src = readComponent("RecentActivitySection.tsx");
  assert.ok(
    src.includes("ago") ||
      src.includes("today") ||
      src.includes("formatRelativeTime") ||
      src.includes("relativeTime"),
    "Must show relative timestamps for session items",
  );
});

// ---------------------------------------------------------------------------
// SuggestionsSection component exists
// ---------------------------------------------------------------------------

void test("SuggestionsSection component file exists", () => {
  const src = readComponent("SuggestionsSection.tsx");
  assert.ok(
    src.length > 0,
    "SuggestionsSection.tsx must exist and not be empty",
  );
});

// ---------------------------------------------------------------------------
// SuggestionsSection displays suggestions heading
// ---------------------------------------------------------------------------

void test("SuggestionsSection renders a 'Suggestions' heading", () => {
  const src = readComponent("SuggestionsSection.tsx");
  assert.ok(
    src.includes("Suggestions"),
    "Must include 'Suggestions' heading text",
  );
});

// ---------------------------------------------------------------------------
// SuggestionsSection shows contextual suggestions when sessions exist
// ---------------------------------------------------------------------------

void test("SuggestionsSection shows contextual suggestions based on sessions", () => {
  const src = readComponent("SuggestionsSection.tsx");
  assert.ok(
    src.includes("Continue") ||
      src.includes("Re-run") ||
      src.includes("continue"),
    "Must show contextual suggestions like 'Continue' or 'Re-run' when history exists",
  );
});

// ---------------------------------------------------------------------------
// SuggestionsSection shows fallback suggestions when no history
// ---------------------------------------------------------------------------

void test("SuggestionsSection shows fallback suggestions when no sessions exist", () => {
  const src = readComponent("SuggestionsSection.tsx");
  assert.ok(
    src.includes("Morning Brief") ||
      src.includes("Watchlist") ||
      src.includes("Start with"),
    "Must show generic fallback suggestions when there is no session history",
  );
});

// ---------------------------------------------------------------------------
// SuggestionsSection items are clickable
// ---------------------------------------------------------------------------

void test("SuggestionsSection suggestion items have click handlers", () => {
  const src = readComponent("SuggestionsSection.tsx");
  assert.ok(
    src.includes("onClick") || src.includes("onCardClick"),
    "Suggestion items must be clickable",
  );
});

// ---------------------------------------------------------------------------
// LaunchpadWorkspace integration
// ---------------------------------------------------------------------------

void test("LaunchpadWorkspace imports and renders RecentActivitySection", () => {
  const src = readComponent("LaunchpadWorkspace.tsx");
  assert.ok(
    src.includes("RecentActivitySection"),
    "LaunchpadWorkspace must import and render RecentActivitySection",
  );
});

void test("LaunchpadWorkspace imports and renders SuggestionsSection", () => {
  const src = readComponent("LaunchpadWorkspace.tsx");
  assert.ok(
    src.includes("SuggestionsSection"),
    "LaunchpadWorkspace must import and render SuggestionsSection",
  );
});

void test("LaunchpadWorkspace passes sessions to RecentActivitySection", () => {
  const src = readComponent("LaunchpadWorkspace.tsx");
  assert.ok(
    src.includes("sessions"),
    "LaunchpadWorkspace must pass sessions prop",
  );
});

void test("LaunchpadWorkspace accepts sessions prop", () => {
  const src = readComponent("LaunchpadWorkspace.tsx");
  assert.ok(
    src.includes("sessions") && src.includes("AgentSession"),
    "LaunchpadWorkspace must accept sessions as a prop with AgentSession type",
  );
});

void test("LaunchpadWorkspace accepts onSessionSelect prop", () => {
  const src = readComponent("LaunchpadWorkspace.tsx");
  assert.ok(
    src.includes("onSessionSelect"),
    "LaunchpadWorkspace must accept onSessionSelect callback prop",
  );
});

// ---------------------------------------------------------------------------
// Relative time utility
// ---------------------------------------------------------------------------

void test("formatRelativeTime utility exists", () => {
  const src = readFile("format-relative-time.ts");
  assert.ok(
    src.length > 0,
    "format-relative-time.ts must exist and not be empty",
  );
});

void test("formatRelativeTime handles recent times", () => {
  const src = readFile("format-relative-time.ts");
  assert.ok(
    src.includes("just now") || src.includes("minute") || src.includes("hour"),
    "Must handle recent time formatting (minutes, hours)",
  );
});

void test("formatRelativeTime handles older times", () => {
  const src = readFile("format-relative-time.ts");
  assert.ok(
    src.includes("day") || src.includes("yesterday"),
    "Must handle older time formatting (days)",
  );
});
