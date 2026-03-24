import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Brain page polish: subtitle, empty-state icons + CTA buttons
// ---------------------------------------------------------------------------

function readComponent(fileName: string): string {
  return readFileSync(resolve(__dirname, "components", fileName), "utf-8");
}

// ---------------------------------------------------------------------------
// Subtitle
// ---------------------------------------------------------------------------

void test("BrainKnowledgeWorkspace has a subtitle describing the page purpose", () => {
  const src = readComponent("BrainKnowledgeWorkspace.tsx");
  assert.ok(
    src.includes("Your research memory"),
    "Should contain subtitle text about research memory",
  );
});

// ---------------------------------------------------------------------------
// Empty-state config helpers
// ---------------------------------------------------------------------------

interface BrainEmptyStateConfig {
  icon: string;
  color: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}

function referencesEmptyConfig(): BrainEmptyStateConfig {
  return {
    icon: "BookOpenIcon",
    color: "blue-500",
    title: "No references yet",
    description: "Files and documentation shared in chat will appear here.",
    ctaLabel: "Go to Chat",
    ctaHref: "#chat",
  };
}

function notesEmptyConfig(): BrainEmptyStateConfig {
  return {
    icon: "StickyNoteIcon",
    color: "amber-500",
    title: "No notes yet",
    description:
      "Observations and insights from your research will appear here.",
    ctaLabel: "Start Research",
    ctaHref: "#launchpad",
  };
}

void test("references empty config uses BookOpenIcon", () => {
  assert.equal(referencesEmptyConfig().icon, "BookOpenIcon");
});

void test("references empty config uses blue-500 color", () => {
  assert.equal(referencesEmptyConfig().color, "blue-500");
});

void test("references empty config title is 'No references yet'", () => {
  assert.equal(referencesEmptyConfig().title, "No references yet");
});

void test("references empty config CTA links to #chat", () => {
  assert.equal(referencesEmptyConfig().ctaHref, "#chat");
  assert.equal(referencesEmptyConfig().ctaLabel, "Go to Chat");
});

void test("notes empty config uses StickyNoteIcon", () => {
  assert.equal(notesEmptyConfig().icon, "StickyNoteIcon");
});

void test("notes empty config uses amber-500 color", () => {
  assert.equal(notesEmptyConfig().color, "amber-500");
});

void test("notes empty config title is 'No notes yet'", () => {
  assert.equal(notesEmptyConfig().title, "No notes yet");
});

void test("notes empty config CTA links to #launchpad", () => {
  assert.equal(notesEmptyConfig().ctaHref, "#launchpad");
  assert.equal(notesEmptyConfig().ctaLabel, "Start Research");
});

// ---------------------------------------------------------------------------
// Component file assertions
// ---------------------------------------------------------------------------

void test("BrainKnowledgeWorkspace uses shared EmptyState for references (blue)", () => {
  const src = readComponent("BrainKnowledgeWorkspace.tsx");
  assert.ok(
    src.includes("@/components/EmptyState"),
    "Should import shared EmptyState component",
  );
  assert.ok(
    src.includes("<EmptyState") && src.includes('"blue"'),
    "Should use EmptyState with blue iconColor for references",
  );
});

void test("BrainKnowledgeWorkspace uses shared EmptyState for notes (amber)", () => {
  const src = readComponent("BrainKnowledgeWorkspace.tsx");
  assert.ok(
    src.includes("<EmptyState") && src.includes('"amber"'),
    "Should use EmptyState with amber iconColor for notes",
  );
});

void test("BrainKnowledgeWorkspace includes CTA buttons", () => {
  const src = readComponent("BrainKnowledgeWorkspace.tsx");
  assert.ok(src.includes("Go to Chat"), "Should have 'Go to Chat' CTA");
  assert.ok(src.includes("Start Research"), "Should have 'Start Research' CTA");
});

void test("BrainKnowledgeWorkspace imports Button component", () => {
  const src = readComponent("BrainKnowledgeWorkspace.tsx");
  assert.ok(
    src.includes("@/components/ui/button"),
    "Should import Button from UI library",
  );
});

void test("CTA buttons use outline variant", () => {
  const src = readComponent("BrainKnowledgeWorkspace.tsx");
  assert.ok(
    src.includes('variant="outline"'),
    "CTA buttons should use outline variant",
  );
});

void test("empty state headings are rendered by shared EmptyState component", () => {
  const src = readComponent("BrainKnowledgeWorkspace.tsx");
  assert.ok(
    src.includes("<EmptyState"),
    "Should delegate heading rendering to shared EmptyState component",
  );
  // Section headers still use the section-level font-semibold
  assert.ok(
    src.includes("font-semibold"),
    "Section headers should use font-semibold",
  );
});
