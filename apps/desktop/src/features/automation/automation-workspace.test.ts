import assert from "node:assert/strict";
import test from "node:test";
import { AUTOMATION_EMPTY_TEXT } from "./components/AutomationWorkspace";

void test("AUTOMATION_EMPTY_TEXT is a non-empty string", () => {
  assert.ok(typeof AUTOMATION_EMPTY_TEXT === "string");
  assert.ok(AUTOMATION_EMPTY_TEXT.length > 0);
});

void test("AutomationWorkspace exports a function component", async () => {
  const mod = await import("./components/AutomationWorkspace");
  assert.equal(typeof mod.AutomationWorkspace, "function");
});
