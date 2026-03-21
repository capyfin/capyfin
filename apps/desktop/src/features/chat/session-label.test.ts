import assert from "node:assert/strict";
import test from "node:test";
import { deriveSessionLabel, formatSessionLabel } from "./session-label";

// ---------------------------------------------------------------------------
// formatSessionLabel
// ---------------------------------------------------------------------------

void test("formatSessionLabel returns the session label when present", () => {
  const session = makeSession({ label: "Deep Dive: NVDA" });
  assert.equal(formatSessionLabel(session), "Deep Dive: NVDA");
});

void test("formatSessionLabel returns 'New conversation' when label is undefined", () => {
  const session = makeSession({ label: undefined });
  assert.equal(formatSessionLabel(session), "New conversation");
});

void test("formatSessionLabel preserves existing labels unchanged", () => {
  const session = makeSession({ label: "Morning Brief" });
  assert.equal(formatSessionLabel(session), "Morning Brief");
});

// ---------------------------------------------------------------------------
// deriveSessionLabel
// ---------------------------------------------------------------------------

void test("deriveSessionLabel returns short text as-is", () => {
  assert.equal(deriveSessionLabel("Hello world"), "Hello world");
});

void test("deriveSessionLabel collapses internal whitespace", () => {
  assert.equal(deriveSessionLabel("Hello   world"), "Hello world");
});

void test("deriveSessionLabel trims leading and trailing whitespace", () => {
  assert.equal(deriveSessionLabel("  Hello world  "), "Hello world");
});

void test("deriveSessionLabel truncates text longer than 40 characters", () => {
  const long = "A".repeat(50);
  const result = deriveSessionLabel(long);
  assert.equal(result.length, 40);
  assert.ok(result.endsWith("..."));
});

void test("deriveSessionLabel does not truncate text at exactly 40 characters", () => {
  const exact = "A".repeat(40);
  assert.equal(deriveSessionLabel(exact), exact);
});

void test("deriveSessionLabel truncates text at 41 characters", () => {
  const text = "A".repeat(41);
  const result = deriveSessionLabel(text);
  assert.equal(result, "A".repeat(37) + "...");
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSession(overrides: { label?: string | undefined }) {
  return {
    id: "test-id",
    agentId: "main",
    agentName: "CapyFin",
    sessionKey: "key-1",
    label: overrides.label,
    sessionFile: "/tmp/session.json",
    workspaceDir: "/tmp",
    createdAt: "2026-03-21T00:00:00Z",
    updatedAt: "2026-03-21T00:00:00Z",
  };
}
