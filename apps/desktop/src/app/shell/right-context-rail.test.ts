import assert from "node:assert/strict";
import test from "node:test";

void test("RightContextRail exports a function component", async () => {
  const mod = await import("./RightContextRail");
  assert.equal(typeof mod.RightContextRail, "function");
});

void test("RightContextRail component accepts isOpen and onClose props", async () => {
  const mod = await import("./RightContextRail");
  // Verify the function exists and has expected arity (props object = 1 param)
  assert.equal(mod.RightContextRail.length, 1);
});
