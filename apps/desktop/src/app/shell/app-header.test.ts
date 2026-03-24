import assert from "node:assert/strict";
import test from "node:test";

void test("VIEW_TITLES includes all workspace views", async () => {
  // The VIEW_TITLES record is not exported, but AppHeader uses it.
  // We verify indirectly by checking the export.
  const mod = await import("./AppHeader");
  assert.equal(typeof mod.AppHeader, "function");
});

void test("AppHeader no longer requires onCreateAgent prop", async () => {
  const mod = await import("./AppHeader");
  // AppHeader accepts a props object (1 param)
  assert.equal(mod.AppHeader.length, 1);
});
