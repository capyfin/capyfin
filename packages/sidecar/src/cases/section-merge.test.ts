import assert from "node:assert/strict";
import test from "node:test";
import type { CaseSection } from "@capyfin/contracts";
import { mergeSections } from "./section-merge.ts";

function section(
  overrides: Partial<CaseSection> & { title: string },
): CaseSection {
  return {
    id:
      overrides.id ??
      `id-${overrides.title.toLowerCase().replace(/\s+/g, "-")}`,
    title: overrides.title,
    content: overrides.content ?? `Content for ${overrides.title}`,
    confidence: overrides.confidence ?? "MEDIUM",
    citations: overrides.citations ?? [],
  };
}

function at<T>(arr: T[], index: number): T {
  const item = arr[index];
  assert.ok(item !== undefined, `Expected item at index ${String(index)}`);
  return item;
}

void test("mergeSections: matching titles update content, confidence, and citations", () => {
  const existing = [
    section({ title: "Thesis", content: "Old thesis", confidence: "LOW" }),
  ];
  const incoming = [
    section({
      title: "Thesis",
      id: "new-id",
      content: "New thesis",
      confidence: "HIGH",
      citations: [
        { label: "SEC filing", source: "sec.gov", date: "2026-04-01" },
      ],
    }),
  ];
  const merged = mergeSections(existing, incoming);
  assert.equal(merged.length, 1);
  assert.equal(at(merged, 0).content, "New thesis");
  assert.equal(at(merged, 0).confidence, "HIGH");
  assert.equal(at(merged, 0).citations.length, 1);
  // Existing ID is preserved
  assert.equal(at(merged, 0).id, at(existing, 0).id);
});

void test("mergeSections: non-matching titles are appended", () => {
  const existing = [section({ title: "Thesis" })];
  const incoming = [section({ title: "Valuation" })];
  const merged = mergeSections(existing, incoming);
  assert.equal(merged.length, 2);
  assert.equal(at(merged, 0).title, "Thesis");
  assert.equal(at(merged, 1).title, "Valuation");
});

void test("mergeSections: case-insensitive title matching", () => {
  const existing = [section({ title: "RISKS" })];
  const incoming = [
    section({ title: "risks", content: "Updated risks", id: "new-id" }),
  ];
  const merged = mergeSections(existing, incoming);
  assert.equal(merged.length, 1);
  assert.equal(at(merged, 0).content, "Updated risks");
  assert.equal(at(merged, 0).id, at(existing, 0).id);
});

void test("mergeSections: existing section IDs are preserved on match", () => {
  const existing = [section({ title: "Thesis", id: "original-id-123" })];
  const incoming = [section({ title: "Thesis", id: "incoming-id-456" })];
  const merged = mergeSections(existing, incoming);
  assert.equal(at(merged, 0).id, "original-id-123");
});

void test("mergeSections: empty incoming returns existing unchanged", () => {
  const existing = [section({ title: "Thesis" }), section({ title: "Risks" })];
  const merged = mergeSections(existing, []);
  assert.deepEqual(merged, existing);
});

void test("mergeSections: empty existing returns incoming as-is", () => {
  const incoming = [section({ title: "Thesis" }), section({ title: "Risks" })];
  const merged = mergeSections([], incoming);
  assert.deepEqual(merged, incoming);
});

void test("mergeSections: mixed match and append", () => {
  const existing = [
    section({ title: "Thesis", content: "Old" }),
    section({ title: "Risks", content: "Old risks" }),
  ];
  const incoming = [
    section({ title: "Thesis", content: "New", id: "new-1" }),
    section({ title: "Valuation", content: "New valuation" }),
  ];
  const merged = mergeSections(existing, incoming);
  assert.equal(merged.length, 3);
  assert.equal(at(merged, 0).title, "Thesis");
  assert.equal(at(merged, 0).content, "New");
  assert.equal(at(merged, 1).title, "Risks");
  assert.equal(at(merged, 1).content, "Old risks");
  assert.equal(at(merged, 2).title, "Valuation");
  assert.equal(at(merged, 2).content, "New valuation");
});
