import assert from "node:assert/strict";
import test from "node:test";
import { CHAT_INPUT_PLACEHOLDER } from "./chat-placeholder";

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
