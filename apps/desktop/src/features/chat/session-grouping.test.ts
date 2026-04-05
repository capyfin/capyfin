import assert from "node:assert/strict";
import test from "node:test";
import {
  groupSessionsByDate,
  partitionAllGroupsSessions,
  partitionGroupSessions,
  type SessionGroup,
} from "./session-grouping";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSession(id: string, updatedAt: string, label?: string) {
  return {
    id,
    agentId: "main",
    agentName: "CapyFin",
    sessionKey: `key-${id}`,
    label: label ?? `Session ${id}`,
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
  assert.deepEqual(labels, [
    "Today",
    "Yesterday",
    "This week",
    "This month",
    "Older",
  ]);
});

// ---------------------------------------------------------------------------
// partitionGroupSessions
// ---------------------------------------------------------------------------

void test("partitions all named sessions into named array", () => {
  const sessions = [
    makeSession("a", "2026-03-21T10:00:00Z", "Deep Dive: AAPL"),
    makeSession("b", "2026-03-21T09:00:00Z", "Morning Brief"),
  ];
  const result = partitionGroupSessions(sessions);
  assert.equal(result.named.length, 2);
  assert.equal(result.unnamed.length, 0);
});

void test("partitions sessions with default label into unnamed array", () => {
  // makeSession without explicit label generates "Session <id>" which is named;
  // use "New conversation" to test unnamed detection
  const sessions = [
    makeSession("a", "2026-03-21T10:00:00Z", "New conversation"),
    makeSession("b", "2026-03-21T09:00:00Z", "New conversation"),
  ];
  const result = partitionGroupSessions(sessions);
  assert.equal(result.named.length, 0);
  assert.equal(result.unnamed.length, 2);
});

void test("partitions UUID-prefix labels into unnamed array", () => {
  const sessions = [
    makeSession("a", "2026-03-21T10:00:00Z", "d789933d (2026-03-22)"),
  ];
  const result = partitionGroupSessions(sessions);
  assert.equal(result.named.length, 0);
  assert.equal(result.unnamed.length, 1);
});

void test("partitions mixed named and unnamed sessions correctly", () => {
  const sessions = [
    makeSession("a", "2026-03-21T10:00:00Z", "Deep Dive: AAPL"),
    makeSession("b", "2026-03-21T09:00:00Z", "New conversation"),
    makeSession("c", "2026-03-21T08:00:00Z", "Morning Brief"),
    makeSession("d", "2026-03-21T07:00:00Z", "New conversation"),
    makeSession("e", "2026-03-21T06:00:00Z", "New conversation"),
  ];
  const result = partitionGroupSessions(sessions);
  assert.equal(result.named.length, 2);
  assert.deepEqual(
    result.named.map((s) => s.id),
    ["a", "c"],
  );
  assert.equal(result.unnamed.length, 3);
  assert.deepEqual(
    result.unnamed.map((s) => s.id),
    ["b", "d", "e"],
  );
});

void test("preserves order within named and unnamed partitions", () => {
  const sessions = [
    makeSession("1", "2026-03-21T10:00:00Z", "Alpha"),
    makeSession("2", "2026-03-21T09:00:00Z", "New conversation"),
    makeSession("3", "2026-03-21T08:00:00Z", "Beta"),
    makeSession("4", "2026-03-21T07:00:00Z", "New conversation"),
  ];
  const result = partitionGroupSessions(sessions);
  assert.deepEqual(
    result.named.map((s) => s.id),
    ["1", "3"],
  );
  assert.deepEqual(
    result.unnamed.map((s) => s.id),
    ["2", "4"],
  );
});

void test("handles empty sessions array", () => {
  const result = partitionGroupSessions([]);
  assert.equal(result.named.length, 0);
  assert.equal(result.unnamed.length, 0);
});

// ---------------------------------------------------------------------------
// partitionAllGroupsSessions
// ---------------------------------------------------------------------------

void test("partitionAllGroupsSessions aggregates unnamed from all groups", () => {
  const groups: SessionGroup[] = [
    {
      label: "Today",
      sessions: [
        makeSession("t1", "2026-03-21T10:00:00Z", "Deep Dive: AAPL"),
        makeSession("t2", "2026-03-21T09:00:00Z", "New conversation"),
        makeSession("t3", "2026-03-21T08:00:00Z", "New conversation"),
      ],
    },
    {
      label: "Older",
      sessions: [
        makeSession("o1", "2026-01-05T12:00:00Z", "New conversation"),
        makeSession("o2", "2026-01-04T12:00:00Z", "Morning Brief"),
      ],
    },
  ];
  const result = partitionAllGroupsSessions(groups);
  // Named groups should only contain named sessions
  assert.equal(result.namedGroups.length, 2);
  assert.deepEqual(
    at(result.namedGroups, 0).sessions.map((s) => s.id),
    ["t1"],
  );
  assert.deepEqual(
    at(result.namedGroups, 1).sessions.map((s) => s.id),
    ["o2"],
  );
  // All unnamed aggregated
  assert.equal(result.allUnnamed.length, 3);
  assert.deepEqual(
    result.allUnnamed.map((s) => s.id),
    ["t2", "t3", "o1"],
  );
});

void test("partitionAllGroupsSessions omits groups with only unnamed sessions", () => {
  const groups: SessionGroup[] = [
    {
      label: "Today",
      sessions: [makeSession("t1", "2026-03-21T10:00:00Z", "New conversation")],
    },
    {
      label: "Older",
      sessions: [makeSession("o1", "2026-01-05T12:00:00Z", "Morning Brief")],
    },
  ];
  const result = partitionAllGroupsSessions(groups);
  // Only the Older group should remain (Today had only unnamed)
  assert.equal(result.namedGroups.length, 1);
  assert.equal(at(result.namedGroups, 0).label, "Older");
  assert.equal(result.allUnnamed.length, 1);
  assert.equal(at(result.allUnnamed, 0).id, "t1");
});

void test("partitionAllGroupsSessions handles empty groups array", () => {
  const result = partitionAllGroupsSessions([]);
  assert.equal(result.namedGroups.length, 0);
  assert.equal(result.allUnnamed.length, 0);
});

void test("partitionAllGroupsSessions returns empty unnamed when all are named", () => {
  const groups: SessionGroup[] = [
    {
      label: "Today",
      sessions: [
        makeSession("a", "2026-03-21T10:00:00Z", "Deep Dive"),
        makeSession("b", "2026-03-21T09:00:00Z", "Morning Brief"),
      ],
    },
  ];
  const result = partitionAllGroupsSessions(groups);
  assert.equal(result.namedGroups.length, 1);
  assert.equal(at(result.namedGroups, 0).sessions.length, 2);
  assert.equal(result.allUnnamed.length, 0);
});
