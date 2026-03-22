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

void test("formatSessionLabel replaces UUID-prefix label with 'New conversation'", () => {
  const session = makeSession({ label: "d789933d (2026-03-22)" });
  assert.equal(formatSessionLabel(session), "New conversation");
});

void test("formatSessionLabel replaces UUID-prefix label without space before paren", () => {
  const session = makeSession({ label: "f043f4e7(2026-03-22)" });
  assert.equal(formatSessionLabel(session), "New conversation");
});

void test("formatSessionLabel replaces uppercase UUID-prefix label", () => {
  const session = makeSession({ label: "D789933D (2026-03-22)" });
  assert.equal(formatSessionLabel(session), "New conversation");
});

void test("formatSessionLabel replaces bare 8-char hex ID without date suffix", () => {
  const session = makeSession({ label: "f1a26b39" });
  assert.equal(formatSessionLabel(session), "New conversation");
});

void test("formatSessionLabel does not replace labels starting with hex-like words", () => {
  const session = makeSession({ label: "Feedback on Q1 report" });
  assert.equal(formatSessionLabel(session), "Feedback on Q1 report");
});

void test("formatSessionLabel preserves labels that look like hex but are too short", () => {
  const session = makeSession({ label: "abcdef (note)" });
  assert.equal(formatSessionLabel(session), "abcdef (note)");
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
