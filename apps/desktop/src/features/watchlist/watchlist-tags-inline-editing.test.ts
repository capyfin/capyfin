import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readComponent(filename: string): string {
  return readFileSync(resolve(__dirname, "components", filename), "utf-8");
}

// ---------------------------------------------------------------------------
// AC1: Empty TAGS cells show a "+ Add tag" button
// ---------------------------------------------------------------------------

void test("Empty TAGS cells show a '+ Add tag' button", () => {
  const src = readComponent("WatchlistTable.tsx");

  assert.ok(
    src.includes("Add tag"),
    'Empty TAGS cells must show an "Add tag" placeholder button',
  );
});

// ---------------------------------------------------------------------------
// AC2: Clicking "+ Add tag" calls onEdit to allow adding a tag
// ---------------------------------------------------------------------------

void test("'+ Add tag' button has an onClick handler wired to onEdit", () => {
  const src = readComponent("WatchlistTable.tsx");

  // The Add tag button must be a <button> with an onClick that calls onEdit
  assert.match(
    src,
    /Add tag[\s\S]{0,300}onEdit|onEdit[\s\S]{0,300}Add tag/,
    '"+ Add tag" must trigger onEdit when clicked',
  );
});

// ---------------------------------------------------------------------------
// AC3: Existing tags display as compact badges
// ---------------------------------------------------------------------------

void test("Existing tags render as Badge components", () => {
  const src = readComponent("WatchlistTable.tsx");

  // Tags should be rendered with Badge components
  assert.match(
    src,
    /item\.tags[\s\S]{0,300}Badge/,
    "Existing tags must render as Badge components",
  );
});

// ---------------------------------------------------------------------------
// AC4: The button style matches "+ Add note" pattern
// ---------------------------------------------------------------------------

void test("'+ Add tag' button uses same styling as '+ Add note'", () => {
  const src = readComponent("WatchlistTable.tsx");

  // The Add tag button should use the same text-[12px] text-muted-foreground/40
  // hover:text-foreground style as the Add note button
  const addTagMatch =
    /text-\[12px\][^"]*text-muted-foreground\/40[^"]*hover:text-foreground[\s\S]{0,200}Add tag/.exec(
      src,
    );
  assert.ok(
    addTagMatch,
    '"+ Add tag" button must use the same styling as "+ Add note" (text-[12px] text-muted-foreground/40 hover:text-foreground)',
  );
});

// ---------------------------------------------------------------------------
// AC5: When tags exist, a "+" button is shown to add more
// ---------------------------------------------------------------------------

void test("When tags exist, an add-more button is shown alongside badges", () => {
  const src = readComponent("WatchlistTable.tsx");

  // After rendering existing tags, there should be a "+" or add button
  // to allow adding more tags even when some already exist
  assert.match(
    src,
    /item\.tags\.map[\s\S]{0,800}onEdit/,
    "Tags section must include an add-more button alongside existing badges",
  );
});
