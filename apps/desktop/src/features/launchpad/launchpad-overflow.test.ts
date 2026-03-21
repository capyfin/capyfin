import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readFile(relativePath: string): string {
  return readFileSync(resolve(__dirname, relativePath), "utf-8");
}

// ---------------------------------------------------------------------------
// Content overflow — Launchpad content must scroll within its container
// ---------------------------------------------------------------------------

void test("Content wrapper applies overflow-y-auto for non-chat views", () => {
  const src = readFile("../../app/App.tsx");

  // The content wrapper div must have overflow-y-auto so Launchpad (and other
  // non-chat workspaces) can scroll when content exceeds the viewport height.
  assert.ok(
    src.includes("overflow-y-auto"),
    "Content wrapper must include overflow-y-auto to allow scrolling",
  );
});

void test("LaunchpadWorkspace does not use flex-1 which prevents overflow scrolling", () => {
  const src = readFile("components/LaunchpadWorkspace.tsx");

  // flex-1 on the LaunchpadWorkspace forces it to match the container height
  // instead of growing to its natural content height. This prevents the parent's
  // overflow-y-auto from creating a scrollbar.
  assert.ok(
    !src.includes("flex-1"),
    "LaunchpadWorkspace must not use flex-1 — it prevents content from overflowing the scroll container",
  );
});

void test("LaunchpadWorkspace remains a flex column for internal layout", () => {
  const src = readFile("components/LaunchpadWorkspace.tsx");

  // The component must still use flex-col for stacking sections vertically
  assert.ok(
    src.includes("flex-col"),
    "LaunchpadWorkspace must use flex-col for vertical section stacking",
  );
});

void test("LaunchpadWorkspace has bottom padding for scroll comfort", () => {
  const src = readFile("components/LaunchpadWorkspace.tsx");

  // When scrolling, the last section should not be flush against the bottom edge.
  // A bottom padding class (pb-*) ensures comfortable scrolling.
  assert.match(
    src,
    /pb-\d/,
    "LaunchpadWorkspace must include bottom padding (pb-*) for scroll comfort",
  );
});
