import assert from "node:assert/strict";
import test from "node:test";
import type { AgentSession } from "@capyfin/contracts";
import {
  getNavigationItems,
  getActionItems,
  getSessionItems,
} from "./palette-items";

function makeSession(
  overrides: Partial<AgentSession> & { id: string },
): AgentSession {
  return {
    agentId: "main",
    agentName: "main",
    sessionKey: `agent:main:session:${overrides.id}`,
    sessionFile: `/tmp/${overrides.id}.json`,
    workspaceDir: "/tmp",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Navigation items
// ---------------------------------------------------------------------------

void test("getNavigationItems returns items for all primary navigation entries", () => {
  const items = getNavigationItems();
  assert.ok(items.length >= 6, "Should have at least 6 navigation items");
});

void test("navigation items have category 'Navigation'", () => {
  const items = getNavigationItems();
  for (const item of items) {
    assert.equal(item.category, "Navigation");
  }
});

void test("navigation items include Home and Settings", () => {
  const items = getNavigationItems();
  const labels = items.map((i) => i.label);
  assert.ok(labels.includes("Home"), "Should include Home");
  assert.ok(labels.includes("Settings"), "Should include Settings");
});

void test("navigation items have unique ids", () => {
  const items = getNavigationItems();
  const ids = items.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length, "IDs should be unique");
});

// ---------------------------------------------------------------------------
// Action items
// ---------------------------------------------------------------------------

void test("getActionItems returns items from card registry", () => {
  const items = getActionItems();
  assert.ok(items.length > 0, "Should return action items");
});

void test("action items have category 'Actions'", () => {
  const items = getActionItems();
  for (const item of items) {
    assert.equal(item.category, "Actions");
  }
});

void test("action items include Deep Dive and Fair Value", () => {
  const items = getActionItems();
  const labels = items.map((i) => i.label);
  assert.ok(labels.includes("Deep Dive"), "Should include Deep Dive");
  assert.ok(labels.includes("Fair Value"), "Should include Fair Value");
});

void test("action items include Earnings Momentum, Smart Money, and Income Finder", () => {
  const items = getActionItems();
  const labels = items.map((i) => i.label);
  assert.ok(
    labels.includes("Earnings Momentum"),
    "Should include Earnings Momentum",
  );
  assert.ok(labels.includes("Smart Money"), "Should include Smart Money");
  assert.ok(labels.includes("Income Finder"), "Should include Income Finder");
});

void test("action items have unique ids", () => {
  const items = getActionItems();
  const ids = items.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length, "IDs should be unique");
});

// ---------------------------------------------------------------------------
// Session items
// ---------------------------------------------------------------------------

void test("getSessionItems returns empty array for empty sessions", () => {
  const items = getSessionItems([]);
  assert.equal(items.length, 0);
});

void test("getSessionItems maps sessions correctly", () => {
  const sessions = [
    makeSession({ id: "s1", label: "Deep Dive: AAPL" }),
    makeSession({ id: "s2", label: "Morning Brief" }),
  ];
  const items = getSessionItems(sessions);
  assert.equal(items.length, 2);
  const first = items[0];
  const second = items[1];
  assert.ok(first, "First item should exist");
  assert.ok(second, "Second item should exist");
  assert.equal(first.label, "Deep Dive: AAPL");
  assert.equal(first.category, "Recent Sessions");
  assert.equal(first.id, "session-s1");
  assert.equal(second.label, "Morning Brief");
});

void test("getSessionItems uses session id as fallback label", () => {
  const sessions = [makeSession({ id: "s1" })];
  const items = getSessionItems(sessions);
  const first = items[0];
  assert.ok(first, "First item should exist");
  assert.equal(first.label, "Chat s1");
});

void test("session items have category 'Recent Sessions'", () => {
  const sessions = [makeSession({ id: "s1", label: "Test" })];
  const items = getSessionItems(sessions);
  const first = items[0];
  assert.ok(first, "First item should exist");
  assert.equal(first.category, "Recent Sessions");
});
