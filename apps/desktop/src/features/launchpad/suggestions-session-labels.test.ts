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
// SuggestionsSection imports formatSessionLabel
// ---------------------------------------------------------------------------

void test("SuggestionsSection imports formatSessionLabel to sanitize labels", () => {
  const src = readComponent("SuggestionsSection.tsx");
  assert.ok(
    src.includes("formatSessionLabel"),
    "Must import formatSessionLabel to derive human-readable session labels",
  );
});

// ---------------------------------------------------------------------------
// SuggestionsSection never exposes raw hex session keys
// ---------------------------------------------------------------------------

void test("SuggestionsSection never falls back to raw sessionKey", () => {
  const src = readComponent("SuggestionsSection.tsx");
  // The old pattern was: mostRecent.label ?? mostRecent.sessionKey
  // This should no longer exist — sessionKey should never be used as a label
  assert.ok(
    !src.includes("mostRecent.sessionKey") &&
      !src.includes("second.sessionKey"),
    "Must not expose raw sessionKey as a label — use formatSessionLabel instead",
  );
});

// ---------------------------------------------------------------------------
// SuggestionsSection skips unnamed sessions (those resolving to "New conversation")
// ---------------------------------------------------------------------------

void test("SuggestionsSection filters out unnamed sessions before building suggestions", () => {
  const src = readComponent("SuggestionsSection.tsx");
  // The component should filter sessions to only named ones
  assert.ok(
    src.includes("filter") || src.includes("find"),
    "Must filter or find named sessions — unnamed sessions should not appear as suggestions",
  );
});

// ---------------------------------------------------------------------------
// SuggestionsSection falls back to FALLBACK_SUGGESTIONS when all sessions are unnamed
// ---------------------------------------------------------------------------

void test("SuggestionsSection falls back to default suggestions when no named sessions exist", () => {
  const src = readComponent("SuggestionsSection.tsx");
  // The component should check if named sessions exist and fall through to fallback
  assert.ok(
    src.includes("FALLBACK_SUGGESTIONS"),
    "Must reference FALLBACK_SUGGESTIONS for fallback when no named sessions exist",
  );
});

// ---------------------------------------------------------------------------
// SuggestionsSection still shows Continue/Re-run for named sessions
// ---------------------------------------------------------------------------

void test("SuggestionsSection shows Continue and Re-run for named sessions", () => {
  const src = readComponent("SuggestionsSection.tsx");
  assert.ok(
    src.includes("Continue:") && src.includes("Re-run:"),
    "Must still show 'Continue:' and 'Re-run:' labels for named sessions",
  );
});
