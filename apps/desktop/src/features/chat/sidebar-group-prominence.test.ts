import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readAppSidebar(): string {
  return readFileSync(
    resolve(__dirname, "../../app/shell/AppSidebar.tsx"),
    "utf-8",
  );
}

// ---------------------------------------------------------------------------
// Temporal group label prominence — subtle, non-intrusive separators
// ---------------------------------------------------------------------------

void test("group label uses text-muted-foreground/50 for subtle color", () => {
  const src = readAppSidebar();
  const separatorLine = src
    .split("\n")
    .find((l) => l.includes("uppercase") && l.includes("tracking-wider"));
  assert.ok(separatorLine, "Group label line must exist");
  assert.ok(
    separatorLine.includes("text-muted-foreground/50"),
    "Group labels must use text-muted-foreground/50 for subtle color",
  );
});

void test("group label uses font-medium for non-competing weight", () => {
  const src = readAppSidebar();
  const separatorLine = src
    .split("\n")
    .find((l) => l.includes("uppercase") && l.includes("tracking-wider"));
  assert.ok(separatorLine, "Group label line must exist");
  assert.ok(
    separatorLine.includes("font-medium"),
    "Group labels must use font-medium for subtle weight",
  );
});

void test("group label has mt-3 for visual separation between groups", () => {
  const src = readAppSidebar();
  const separatorLine = src
    .split("\n")
    .find((l) => l.includes("uppercase") && l.includes("tracking-wider"));
  assert.ok(separatorLine, "Group label line must exist");
  assert.ok(
    separatorLine.includes("mt-3"),
    "Group labels must use mt-3 for clear visual break between groups",
  );
});
