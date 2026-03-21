import assert from "node:assert/strict";
import test from "node:test";
import { primaryNavigation } from "../../app/config/navigation";
import { appReducer, createInitialState } from "../../app/state/app-state";

void test("primaryNavigation includes a Home item pointing to #launchpad", () => {
  const home = primaryNavigation.find(
    (item) => item.href === "#launchpad",
  );
  assert.ok(home, "Home nav item not found");
  assert.equal(home.title, "Home");
});

void test("Home is the first item in primaryNavigation", () => {
  assert.equal(primaryNavigation[0].href, "#launchpad");
});

void test("SET_HASH_VIEW accepts launchpad as a valid view", () => {
  const state = createInitialState(() => "chat");
  const next = appReducer(state, { type: "SET_HASH_VIEW", view: "launchpad" });
  assert.equal(next.hashView, "launchpad");
});
