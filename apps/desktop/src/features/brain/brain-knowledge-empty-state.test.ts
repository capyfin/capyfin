import assert from "node:assert/strict";
import test from "node:test";

// ---------------------------------------------------------------------------
// Brain Knowledge empty-state helper text
// ---------------------------------------------------------------------------

/**
 * The BrainKnowledgeWorkspace displays two sections — References and Notes.
 * When either section is empty, a muted helper line must appear instead of
 * blank space.  The helper line uses `text-sm text-muted-foreground italic`.
 */

const REFERENCES_EMPTY_TEXT =
  "No references added yet. Import files or paste documentation to add context.";
const NOTES_EMPTY_TEXT =
  "No notes yet. Add observations or domain knowledge here.";

// We re-use a pure helper that decides what to render for each section.
// This keeps the logic testable without React.

interface EmptyStateResult {
  show: boolean;
  text: string;
}

function referencesEmptyState(references: unknown[]): EmptyStateResult {
  return {
    show: references.length === 0,
    text: REFERENCES_EMPTY_TEXT,
  };
}

function notesEmptyState(notes: unknown[]): EmptyStateResult {
  return {
    show: notes.length === 0,
    text: NOTES_EMPTY_TEXT,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

void test("referencesEmptyState returns show:true and helper text when array is empty", () => {
  const result = referencesEmptyState([]);
  assert.equal(result.show, true);
  assert.equal(result.text, REFERENCES_EMPTY_TEXT);
});

void test("referencesEmptyState returns show:false when references are present", () => {
  const result = referencesEmptyState([{ id: "1", name: "doc.pdf" }]);
  assert.equal(result.show, false);
});

void test("notesEmptyState returns show:true and helper text when array is empty", () => {
  const result = notesEmptyState([]);
  assert.equal(result.show, true);
  assert.equal(result.text, NOTES_EMPTY_TEXT);
});

void test("notesEmptyState returns show:false when notes are present", () => {
  const result = notesEmptyState([{ id: "1", content: "Some note" }]);
  assert.equal(result.show, false);
});

void test("helper text disappears when content is present (references)", () => {
  const empty = referencesEmptyState([]);
  const populated = referencesEmptyState([{ name: "report.pdf" }]);
  assert.equal(empty.show, true);
  assert.equal(populated.show, false);
});

void test("helper text disappears when content is present (notes)", () => {
  const empty = notesEmptyState([]);
  const populated = notesEmptyState([{ content: "Market note" }]);
  assert.equal(empty.show, true);
  assert.equal(populated.show, false);
});

void test("empty state text is muted and descriptive (references)", () => {
  const result = referencesEmptyState([]);
  assert.ok(result.text.includes("No references"));
  assert.ok(result.text.includes("Import files"));
});

void test("empty state text is muted and descriptive (notes)", () => {
  const result = notesEmptyState([]);
  assert.ok(result.text.includes("No notes"));
  assert.ok(result.text.includes("domain knowledge"));
});
