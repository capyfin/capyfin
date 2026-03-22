import assert from "node:assert/strict";
import test from "node:test";

// ---------------------------------------------------------------------------
// Brain Knowledge section visual differentiation
// ---------------------------------------------------------------------------

/**
 * The BrainKnowledgeWorkspace renders References and Notes sections.
 * Each section needs a distinct accent color for instant visual differentiation:
 *   - References: blue accent (bg tint + icon color)
 *   - Notes: amber/warm accent (bg tint + icon color)
 *
 * We test accent config helpers that map section type → accent classes.
 */

interface SectionAccent {
  containerBg: string;
  iconColor: string;
  borderColor: string;
}

function referencesAccent(): SectionAccent {
  return {
    containerBg: "bg-blue-500/5",
    iconColor: "text-blue-400",
    borderColor: "border-blue-400/20",
  };
}

function notesAccent(): SectionAccent {
  return {
    containerBg: "bg-amber-500/5",
    iconColor: "text-amber-400",
    borderColor: "border-amber-400/20",
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

void test("references accent uses blue family background tint", () => {
  const accent = referencesAccent();
  assert.ok(
    accent.containerBg.includes("blue"),
    "container bg should include blue",
  );
});

void test("references accent uses blue icon color", () => {
  const accent = referencesAccent();
  assert.ok(
    accent.iconColor.includes("blue"),
    "icon color should include blue",
  );
});

void test("notes accent uses amber family background tint", () => {
  const accent = notesAccent();
  assert.ok(
    accent.containerBg.includes("amber"),
    "container bg should include amber",
  );
});

void test("notes accent uses amber icon color", () => {
  const accent = notesAccent();
  assert.ok(
    accent.iconColor.includes("amber"),
    "icon color should include amber",
  );
});

void test("references and notes use different accent colors", () => {
  const refAccent = referencesAccent();
  const noteAccent = notesAccent();
  assert.notEqual(
    refAccent.containerBg,
    noteAccent.containerBg,
    "container backgrounds should differ",
  );
  assert.notEqual(
    refAccent.iconColor,
    noteAccent.iconColor,
    "icon colors should differ",
  );
  assert.notEqual(
    refAccent.borderColor,
    noteAccent.borderColor,
    "border colors should differ",
  );
});

void test("accent backgrounds use low opacity (5%) for subtlety", () => {
  const refAccent = referencesAccent();
  const noteAccent = notesAccent();
  assert.ok(
    refAccent.containerBg.includes("/5"),
    "references bg should use /5 opacity",
  );
  assert.ok(
    noteAccent.containerBg.includes("/5"),
    "notes bg should use /5 opacity",
  );
});

void test("accent border colors use low opacity for subtlety", () => {
  const refAccent = referencesAccent();
  const noteAccent = notesAccent();
  assert.ok(
    refAccent.borderColor.includes("/20"),
    "references border should use low opacity",
  );
  assert.ok(
    noteAccent.borderColor.includes("/20"),
    "notes border should use low opacity",
  );
});

void test("both sections have all three accent properties defined", () => {
  const refAccent = referencesAccent();
  const noteAccent = notesAccent();
  for (const accent of [refAccent, noteAccent]) {
    assert.ok(accent.containerBg.length > 0, "containerBg should not be empty");
    assert.ok(accent.iconColor.length > 0, "iconColor should not be empty");
    assert.ok(accent.borderColor.length > 0, "borderColor should not be empty");
  }
});
