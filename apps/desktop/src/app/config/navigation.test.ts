import assert from "node:assert/strict";
import test from "node:test";
import { primaryNavigation } from "./navigation";

void test("primaryNavigation has exactly 7 items", () => {
  assert.equal(primaryNavigation.length, 7);
});

void test("primaryNavigation contains the correct items in order", () => {
  const titles = primaryNavigation.map((item) => item.title);
  assert.deepEqual(titles, [
    "Home",
    "Cases",
    "Chat",
    "Watchlist",
    "Portfolio",
    "Library",
    "Automation",
  ]);
});

void test("Portfolio nav item uses #portfolio href", () => {
  const portfolioItem = primaryNavigation.find(
    (item) => item.title === "Portfolio",
  );
  assert.ok(portfolioItem, "Portfolio item should exist");
  assert.equal(portfolioItem.href, "#portfolio");
});

void test("Portfolio appears between Watchlist and Library", () => {
  const titles = primaryNavigation.map((item) => item.title);
  const watchlistIdx = titles.indexOf("Watchlist");
  const portfolioIdx = titles.indexOf("Portfolio");
  const libraryIdx = titles.indexOf("Library");
  assert.ok(
    portfolioIdx > watchlistIdx,
    "Portfolio should come after Watchlist",
  );
  assert.ok(portfolioIdx < libraryIdx, "Portfolio should come before Library");
});

void test("Cases nav item uses #cases href", () => {
  const casesItem = primaryNavigation.find((item) => item.title === "Cases");
  assert.ok(casesItem, "Cases item should exist");
  assert.equal(casesItem.href, "#cases");
});

void test("each nav item has a hash-based href", () => {
  for (const item of primaryNavigation) {
    assert.ok(
      item.href.startsWith("#"),
      `${item.title} href should start with #`,
    );
  }
});

void test("Home nav item uses #home href", () => {
  const homeItem = primaryNavigation.find((item) => item.title === "Home");
  assert.ok(homeItem, "Home item should exist");
  assert.equal(homeItem.href, "#home");
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
