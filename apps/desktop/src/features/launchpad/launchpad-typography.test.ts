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
// Launchpad typography hierarchy
// Staircase: 24px heading > 14px subtitle > 15px card title > 12px card desc > 11px section label
// ---------------------------------------------------------------------------

void test("LaunchpadWorkspace heading uses text-[24px]", () => {
  const src = readComponent("LaunchpadWorkspace.tsx");
  assert.ok(
    src.includes('text-[24px]'),
    "Main heading should use text-[24px] for visual dominance",
  );
  assert.ok(
    !src.includes('text-[18px]'),
    "Main heading should no longer use text-[18px]",
  );
});

void test("LaunchpadWorkspace subtitle uses text-[14px]", () => {
  const src = readComponent("LaunchpadWorkspace.tsx");
  assert.ok(
    src.includes('text-[14px]'),
    "Subtitle should use text-[14px]",
  );
  assert.ok(
    !src.includes('text-[13px]'),
    "Subtitle should no longer use text-[13px]",
  );
});

void test("ActionCardItem title uses text-[15px]", () => {
  const src = readComponent("ActionCardItem.tsx");
  assert.ok(
    src.includes('text-[15px]'),
    "Card title should use text-[15px]",
  );
  // The 13px class may still appear for the ticker input, so check the h3 line specifically
  const h3Line = src.split("\n").find((l) => l.includes("<h3"));
  assert.ok(h3Line, "h3 element must exist");
  assert.ok(
    h3Line.includes("text-[15px]"),
    "Card h3 title should use text-[15px]",
  );
});

void test("ActionCardItem description stays at text-[12px]", () => {
  const src = readComponent("ActionCardItem.tsx");
  assert.ok(
    src.includes('text-[12px]'),
    "Card description should remain text-[12px]",
  );
});

void test("CardSection label stays at text-[11px]", () => {
  const src = readComponent("CardSection.tsx");
  assert.ok(
    src.includes('text-[11px]'),
    "Section label should remain text-[11px]",
  );
});

void test("typography staircase: heading > subtitle > card title > card desc > section label", () => {
  const workspace = readComponent("LaunchpadWorkspace.tsx");
  const card = readComponent("ActionCardItem.tsx");
  const section = readComponent("CardSection.tsx");

  // Extract pixel sizes using RegExp.exec() per lint rules
  const headingSize = /h1.*?text-\[(\d+)px\]/s.exec(workspace);
  const subtitleSize = /<p.*?text-\[(\d+)px\]/s.exec(workspace);
  const cardTitleSize = /h3.*?text-\[(\d+)px\]/s.exec(card);
  const cardDescSize = /card\.promise[\s\S]*?text-\[(\d+)px\]/.exec(card) ??
    // fallback: find the description paragraph (the one after h3)
    /<p.*?text-\[(\d+)px\]/s.exec(card);
  const sectionSize = /h2.*?text-\[(\d+)px\]/s.exec(section);

  assert.ok(headingSize, "heading size must be extractable");
  assert.ok(subtitleSize, "subtitle size must be extractable");
  assert.ok(cardTitleSize, "card title size must be extractable");
  assert.ok(cardDescSize, "card desc size must be extractable");
  assert.ok(sectionSize, "section label size must be extractable");

  const heading = Number(headingSize[1]);
  const subtitle = Number(subtitleSize[1]);
  const cardTitle = Number(cardTitleSize[1]);
  const cardDesc = Number(cardDescSize[1]);
  const sectionLabel = Number(sectionSize[1]);

  assert.ok(heading > subtitle, `heading (${String(heading)}) must be > subtitle (${String(subtitle)})`);
  assert.ok(subtitle < cardTitle, `subtitle (${String(subtitle)}) should be < card title (${String(cardTitle)}) — subtitle is lighter weight`);
  assert.ok(cardTitle > cardDesc, `card title (${String(cardTitle)}) must be > card desc (${String(cardDesc)})`);
  assert.ok(cardDesc > sectionLabel, `card desc (${String(cardDesc)}) must be > section label (${String(sectionLabel)})`);
});
