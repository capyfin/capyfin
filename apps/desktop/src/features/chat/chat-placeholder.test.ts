import assert from "node:assert/strict";
import test from "node:test";
import { CHAT_INPUT_PLACEHOLDER, CHAT_EMPTY_STATE_SUBTITLE } from "./chat-placeholder";

void test("CHAT_INPUT_PLACEHOLDER does not contain internal agent name 'Main'", () => {
  assert.ok(!CHAT_INPUT_PLACEHOLDER.includes("Main"));
});

void test("CHAT_INPUT_PLACEHOLDER does not use the 'Message ...' pattern", () => {
  assert.ok(!CHAT_INPUT_PLACEHOLDER.startsWith("Message "));
});

void test("CHAT_INPUT_PLACEHOLDER is a domain-appropriate prompt", () => {
  assert.equal(CHAT_INPUT_PLACEHOLDER, "Ask anything about markets...");
});

void test("CHAT_INPUT_PLACEHOLDER works as a static string for all agents", () => {
  // The placeholder should not reference any specific agent name
  const agentNames = ["Main", "Technical Analyst", "assistant", "default"];
  for (const name of agentNames) {
    assert.ok(
      !CHAT_INPUT_PLACEHOLDER.includes(name),
      `Placeholder should not contain agent name "${name}"`,
    );
  }
});

// --- CHAT_EMPTY_STATE_SUBTITLE tests ---

void test("CHAT_EMPTY_STATE_SUBTITLE does not contain internal agent name 'Main'", () => {
  assert.ok(!CHAT_EMPTY_STATE_SUBTITLE.includes("Main"));
});

void test("CHAT_EMPTY_STATE_SUBTITLE does not reference any agent identifier", () => {
  const agentNames = ["Main", "Technical Analyst", "assistant", "default"];
  for (const name of agentNames) {
    assert.ok(
      !CHAT_EMPTY_STATE_SUBTITLE.includes(name),
      `Subtitle should not contain agent name "${name}"`,
    );
  }
});

void test("CHAT_EMPTY_STATE_SUBTITLE is domain-appropriate", () => {
  assert.equal(
    CHAT_EMPTY_STATE_SUBTITLE,
    "Ask about markets, analysis, and finance decisions.",
  );
});

void test("CHAT_EMPTY_STATE_SUBTITLE has consistent tone with input placeholder", () => {
  // Both should start with "Ask"
  assert.ok(CHAT_EMPTY_STATE_SUBTITLE.startsWith("Ask"));
  assert.ok(CHAT_INPUT_PLACEHOLDER.startsWith("Ask"));
});
