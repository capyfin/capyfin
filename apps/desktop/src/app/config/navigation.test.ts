import assert from "node:assert/strict";
import test from "node:test";
import { primaryNavigation } from "./navigation";

void test("primaryNavigation has exactly 6 items", () => {
  assert.equal(primaryNavigation.length, 6);
});

void test("primaryNavigation contains the correct items in order", () => {
  const titles = primaryNavigation.map((item) => item.title);
  assert.deepEqual(titles, [
    "Home",
    "Chat",
    "Watchlist",
    "Library",
    "Automation",
    "Settings",
  ]);
});

void test("each nav item has a hash-based href", () => {
  for (const item of primaryNavigation) {
    assert.ok(
      item.href.startsWith("#"),
      `${item.title} href should start with #`,
    );
  }
});

void test("Agents, Brain, Providers are not in primary navigation", () => {
  const titles = primaryNavigation.map((item) => item.title);
  assert.ok(!titles.includes("Agents" as never));
  assert.ok(!titles.includes("Brain" as never));
  assert.ok(!titles.includes("Providers" as never));
});

void test("each nav item has an icon component", () => {
  for (const item of primaryNavigation) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    assert.ok(item.icon != null, `${item.title} should have an icon`);
  }
});
