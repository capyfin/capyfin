import assert from "node:assert/strict";
import test from "node:test";
import { groupSessionsByDate } from "./session-grouping";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSession(id: string, updatedAt: string) {
  return {
    id,
    agentId: "main",
    agentName: "CapyFin",
    sessionKey: `key-${id}`,
    label: `Session ${id}`,
    sessionFile: `/tmp/${id}.json`,
    workspaceDir: "/tmp",
    createdAt: "2026-03-01T00:00:00Z",
    updatedAt,
  };
}

/** Safely access a group by index, failing the test if it doesn't exist. */
function at<T>(arr: T[], index: number): T {
  const item = arr[index];
  assert.ok(item !== undefined, `expected item at index ${String(index)}`);
  return item;
}

// Use a fixed "now" for deterministic tests: 2026-03-21 14:00 UTC (a Saturday)
const NOW = new Date("2026-03-21T14:00:00Z");

// ---------------------------------------------------------------------------
// groupSessionsByDate
// ---------------------------------------------------------------------------

void test("groups a session updated today into 'Today'", () => {
  const sessions = [makeSession("a", "2026-03-21T10:00:00Z")];
  const groups = groupSessionsByDate(sessions, NOW);
  assert.equal(groups.length, 1);
  const group = at(groups, 0);
  assert.equal(group.label, "Today");
  assert.equal(group.sessions.length, 1);
  assert.equal(at(group.sessions, 0).id, "a");
});

void test("groups a session updated yesterday into 'Yesterday'", () => {
  const sessions = [makeSession("b", "2026-03-20T22:00:00Z")];
  const groups = groupSessionsByDate(sessions, NOW);
  assert.equal(groups.length, 1);
  assert.equal(at(groups, 0).label, "Yesterday");
});

void test("groups sessions from earlier this week into 'This week'", () => {
  // 2026-03-21 is Saturday. Monday was 2026-03-16.
  const sessions = [makeSession("c", "2026-03-18T12:00:00Z")]; // Wednesday
  const groups = groupSessionsByDate(sessions, NOW);
  assert.equal(groups.length, 1);
  assert.equal(at(groups, 0).label, "This week");
});

void test("groups sessions from earlier this month into 'This month'", () => {
  const sessions = [makeSession("d", "2026-03-10T12:00:00Z")];
  const groups = groupSessionsByDate(sessions, NOW);
  assert.equal(groups.length, 1);
  assert.equal(at(groups, 0).label, "This month");
});

void test("groups sessions from last month or earlier into 'Older'", () => {
  const sessions = [makeSession("e", "2026-02-15T12:00:00Z")];
  const groups = groupSessionsByDate(sessions, NOW);
  assert.equal(groups.length, 1);
  assert.equal(at(groups, 0).label, "Older");
});

void test("returns multiple groups when sessions span different periods", () => {
  const sessions = [
    makeSession("today", "2026-03-21T09:00:00Z"),
    makeSession("yesterday", "2026-03-20T18:00:00Z"),
    makeSession("older", "2026-01-05T12:00:00Z"),
  ];
  const groups = groupSessionsByDate(sessions, NOW);
  assert.equal(groups.length, 3);
  assert.equal(at(groups, 0).label, "Today");
  assert.equal(at(groups, 1).label, "Yesterday");
  assert.equal(at(groups, 2).label, "Older");
});

void test("omits empty groups", () => {
  const sessions = [
    makeSession("today", "2026-03-21T09:00:00Z"),
    makeSession("older", "2026-01-05T12:00:00Z"),
  ];
  const groups = groupSessionsByDate(sessions, NOW);
  // Should have exactly 2 groups, no empty "Yesterday" / "This week" / "This month"
  assert.equal(groups.length, 2);
  assert.equal(at(groups, 0).label, "Today");
  assert.equal(at(groups, 1).label, "Older");
});

void test("returns empty array when sessions is empty", () => {
  const groups = groupSessionsByDate([], NOW);
  assert.equal(groups.length, 0);
});

void test("preserves session order within each group", () => {
  const sessions = [
    makeSession("first", "2026-03-21T12:00:00Z"),
    makeSession("second", "2026-03-21T08:00:00Z"),
    makeSession("third", "2026-03-21T06:00:00Z"),
  ];
  const groups = groupSessionsByDate(sessions, NOW);
  assert.equal(groups.length, 1);
  assert.deepEqual(
    at(groups, 0).sessions.map((s) => s.id),
    ["first", "second", "third"],
  );
});

void test("groups are returned in chronological order (Today first, Older last)", () => {
  // Pass sessions in reverse order to verify the output order is fixed
  const sessions = [
    makeSession("old", "2025-12-01T00:00:00Z"),
    makeSession("month", "2026-03-05T00:00:00Z"),
    makeSession("week", "2026-03-17T00:00:00Z"),
    makeSession("yesterday", "2026-03-20T12:00:00Z"),
    makeSession("today", "2026-03-21T12:00:00Z"),
  ];
  const groups = groupSessionsByDate(sessions, NOW);
  const labels = groups.map((g) => g.label);
  assert.deepEqual(labels, ["Today", "Yesterday", "This week", "This month", "Older"]);
});
