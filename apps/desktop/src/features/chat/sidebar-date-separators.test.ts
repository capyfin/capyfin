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
// Date separator styling — subtle, non-intrusive separators
// ---------------------------------------------------------------------------

void test("date separators use text-[10px] for subtle sizing", () => {
  const src = readAppSidebar();
  const separatorLine = src
    .split("\n")
    .find((l) => l.includes("uppercase") && l.includes("tracking-wider"));
  assert.ok(
    separatorLine,
    "separator line must exist with uppercase + tracking-wider",
  );
  assert.ok(
    separatorLine.includes("text-[10px]"),
    "separators must use text-[10px] for subtle sizing",
  );
});

void test("date separators use font-medium weight", () => {
  const src = readAppSidebar();
  const separatorLine = src
    .split("\n")
    .find((l) => l.includes("uppercase") && l.includes("tracking-wider"));
  assert.ok(separatorLine, "separator line must exist");
  assert.ok(
    separatorLine.includes("font-medium"),
    "separators must use font-medium — not font-semibold — to avoid competing with sessions",
  );
});

void test("date separators use muted color at /50 opacity", () => {
  const src = readAppSidebar();
  const separatorLine = src
    .split("\n")
    .find((l) => l.includes("uppercase") && l.includes("tracking-wider"));
  assert.ok(separatorLine, "separator line must exist");
  assert.ok(
    separatorLine.includes("text-muted-foreground/50"),
    "separators must use text-muted-foreground/50 for subtle color",
  );
});

void test("date separators have adequate horizontal padding", () => {
  const src = readAppSidebar();
  const separatorLine = src
    .split("\n")
    .find((l) => l.includes("uppercase") && l.includes("tracking-wider"));
  assert.ok(separatorLine, "separator line must exist");
  assert.ok(
    separatorLine.includes("px-3"),
    "separators must use px-3 to align with session content",
  );
});

void test("date separator renders group.label text", () => {
  const src = readAppSidebar();
  // The separator element should render {group.label}
  assert.ok(
    src.includes("{group.label}"),
    "separator must render {group.label} text",
  );
});

void test("sessions grouped by date with groupSessionsByDate", () => {
  const src = readAppSidebar();
  assert.ok(
    src.includes("groupSessionsByDate"),
    "sidebar must use groupSessionsByDate for temporal grouping",
  );
  assert.ok(
    src.includes("sessionGroups.map"),
    "sidebar must iterate over session groups",
  );
});
