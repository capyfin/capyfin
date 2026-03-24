import assert from "node:assert/strict";
import test from "node:test";
import { LIBRARY_EMPTY_TEXT } from "./components/LibraryWorkspace";

void test("LIBRARY_EMPTY_TEXT is a non-empty string", () => {
  assert.ok(typeof LIBRARY_EMPTY_TEXT === "string");
  assert.ok(LIBRARY_EMPTY_TEXT.length > 0);
});

void test("LibraryWorkspace exports a function component", async () => {
  const mod = await import("./components/LibraryWorkspace");
  assert.equal(typeof mod.LibraryWorkspace, "function");
});
