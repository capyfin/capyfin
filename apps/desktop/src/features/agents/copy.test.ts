import assert from "node:assert/strict";
import test from "node:test";
import {
  FALLBACK_AGENT_DESCRIPTION,
  formatAgentCount,
  isDevDescription,
} from "./copy.ts";

void test("formatAgentCount returns zero-state message when count is 0", () => {
  assert.equal(formatAgentCount(0), "No custom agents yet.");
});

void test("formatAgentCount uses singular 'agent' when count is 1", () => {
  assert.equal(formatAgentCount(1), "1 agent available");
});

void test("formatAgentCount uses plural 'agents' when count is 2", () => {
  assert.equal(formatAgentCount(2), "2 agents available");
});

void test("formatAgentCount uses plural 'agents' for larger counts", () => {
  assert.equal(formatAgentCount(10), "10 agents available");
});

// --- isDevDescription tests ---

void test("isDevDescription returns true for undefined description", () => {
  assert.equal(isDevDescription(undefined), true);
});

void test("isDevDescription returns true for description containing 'orchestration'", () => {
  assert.equal(isDevDescription("Primary CapyFin finance orchestration agent."), true);
});

void test("isDevDescription returns true for description containing 'workspace agent'", () => {
  assert.equal(isDevDescription("Default workspace agent for finance tasks"), true);
});

void test("isDevDescription returns true for description containing 'default agent'", () => {
  assert.equal(isDevDescription("This is the default agent"), true);
});

void test("isDevDescription is case-insensitive", () => {
  assert.equal(isDevDescription("ORCHESTRATION engine"), true);
  assert.equal(isDevDescription("Workspace Agent setup"), true);
});

void test("isDevDescription returns false for custom user-written description", () => {
  assert.equal(isDevDescription("My personal stock screener bot"), false);
});

void test("isDevDescription returns false for the fallback description itself", () => {
  assert.equal(isDevDescription(FALLBACK_AGENT_DESCRIPTION), false);
});

void test("FALLBACK_AGENT_DESCRIPTION does not contain developer jargon", () => {
  const jargonTerms = ["orchestration", "orchestrator", "primary", "default workspace"];
  for (const term of jargonTerms) {
    assert.ok(
      !FALLBACK_AGENT_DESCRIPTION.toLowerCase().includes(term),
      `Fallback description should not contain developer jargon "${term}"`,
    );
  }
});

void test("FALLBACK_AGENT_DESCRIPTION describes user value", () => {
  assert.ok(
    FALLBACK_AGENT_DESCRIPTION.length > 20,
    "Fallback description should be a meaningful sentence",
  );
});
