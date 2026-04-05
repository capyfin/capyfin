import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const src = fs.readFileSync(
  path.resolve(import.meta.dirname, "components/LibraryEmptyState.tsx"),
  "utf-8",
);

void test("LibraryEmptyState exports a function component", async () => {
  const mod = await import("./components/LibraryEmptyState");
  assert.equal(typeof mod.LibraryEmptyState, "function");
});

void test("heading does not repeat 'library'", () => {
  assert.ok(
    !src.includes('"Your research library"'),
    "Heading must not say 'Your research library'",
  );
});

void test("heading uses non-redundant text", () => {
  assert.ok(
    src.includes('"No reports yet"'),
    "Heading should be 'No reports yet'",
  );
});

void test("description explains what creates library content", () => {
  assert.ok(
    src.includes("Deep Dive") && src.includes("Morning Brief"),
    "Description should mention workflows that create library content",
  );
  assert.ok(
    src.includes("appear here"),
    "Description should explain reports appear here",
  );
});

void test("CTAs are domain-specific, not generic navigation", () => {
  assert.ok(
    !src.includes('"Go to Home"'),
    "Should not have generic 'Go to Home' button",
  );
  assert.ok(
    !src.includes('"Open Chat"'),
    "Should not have generic 'Open Chat' button",
  );
  assert.ok(
    src.includes("Run a Deep Dive"),
    "Should have 'Run a Deep Dive' CTA",
  );
  assert.ok(
    src.includes("Start a Morning Brief"),
    "Should have 'Start a Morning Brief' CTA",
  );
});

void test("workflow cards have a clear section header", () => {
  assert.ok(
    src.includes("Create reports with"),
    "Should have 'Create reports with' section header",
  );
});

void test("workflow cards are clickable (wrapped in button or role=button)", () => {
  // The cards should either be <button> elements or have onClick handlers
  const hasClickableCards =
    src.includes("onClick") &&
    (src.includes("cursor-pointer") || src.includes("<button"));
  assert.ok(hasClickableCards, "Workflow cards should be clickable");
});

void test("uses onRunDeepDive and onStartMorningBrief props", () => {
  assert.ok(src.includes("onRunDeepDive"), "Should have onRunDeepDive prop");
  assert.ok(
    src.includes("onStartMorningBrief"),
    "Should have onStartMorningBrief prop",
  );
});
