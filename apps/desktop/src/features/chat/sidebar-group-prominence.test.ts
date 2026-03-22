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
// Temporal group label prominence
// ---------------------------------------------------------------------------

void test("group label opacity is at least /65 instead of /50", () => {
  const src = readAppSidebar();

  assert.ok(
    !src.includes("text-sidebar-foreground/50"),
    "Group labels must not use /50 opacity — should be /65 or higher for readability",
  );
  assert.ok(
    src.includes("text-sidebar-foreground/65"),
    "Group labels must use /65 opacity for scanning prominence",
  );
});

void test("group label uses font-semibold for visual weight", () => {
  const src = readAppSidebar();

  // The group label line should NOT use font-medium anymore
  const groupLabelLine = src
    .split("\n")
    .find(
      (l) =>
        l.includes("uppercase") &&
        l.includes("tracking-[0.12em]") &&
        l.includes("text-sidebar-foreground"),
    );
  assert.ok(groupLabelLine, "Group label line must exist");
  assert.ok(
    groupLabelLine.includes("font-semibold"),
    "Group labels must use font-semibold for visual weight",
  );
  assert.ok(
    !groupLabelLine.includes("font-medium"),
    "Group labels must not use font-medium — should be font-semibold",
  );
});

void test("group label has increased top padding (pt-4) for visual separation", () => {
  const src = readAppSidebar();

  const groupLabelLine = src
    .split("\n")
    .find(
      (l) =>
        l.includes("uppercase") &&
        l.includes("tracking-[0.12em]") &&
        l.includes("text-sidebar-foreground"),
    );
  assert.ok(groupLabelLine, "Group label line must exist");
  assert.ok(
    groupLabelLine.includes("pt-4"),
    "Group labels must use pt-4 for clear visual break between groups",
  );
  assert.ok(
    !groupLabelLine.includes("pt-3 ") && !groupLabelLine.includes('pt-3"'),
    "Group labels must not use pt-3 — should be pt-4",
  );
});
