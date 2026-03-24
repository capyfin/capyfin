import assert from "node:assert/strict";
import test from "node:test";
import { SETTINGS_DESCRIPTION } from "./components/SettingsWorkspace";

void test("SETTINGS_DESCRIPTION is a non-empty string", () => {
  assert.ok(typeof SETTINGS_DESCRIPTION === "string");
  assert.ok(SETTINGS_DESCRIPTION.length > 0);
});

void test("SettingsWorkspace exports a function component", async () => {
  const mod = await import("./components/SettingsWorkspace");
  assert.equal(typeof mod.SettingsWorkspace, "function");
});
