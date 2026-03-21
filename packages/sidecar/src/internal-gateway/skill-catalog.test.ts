import assert from "node:assert/strict";
import test from "node:test";
import type { BundledSkillEntry } from "./skill-bootstrap.ts";
import { buildSkillCatalog } from "./skill-catalog.ts";

const P0_SKILLS: BundledSkillEntry[] = [
  { id: "morning-brief", category: "finance", path: "finance/morning-brief" },
  { id: "market-health", category: "finance", path: "finance/market-health" },
  { id: "deep-dive", category: "finance", path: "finance/deep-dive" },
  { id: "fair-value", category: "finance", path: "finance/fair-value" },
  {
    id: "fundamental-analyst",
    category: "personas",
    path: "personas/fundamental-analyst",
  },
  { id: "macro-analyst", category: "personas", path: "personas/macro-analyst" },
];

const P1_SKILLS: BundledSkillEntry[] = [
  { id: "earnings-xray", category: "finance", path: "finance/earnings-xray" },
  { id: "bull-bear", category: "finance", path: "finance/bull-bear" },
  {
    id: "breakout-setups",
    category: "finance",
    path: "finance/breakout-setups",
  },
  {
    id: "technical-analyst",
    category: "personas",
    path: "personas/technical-analyst",
  },
];

void test("buildSkillCatalog with P0-only skills includes correct domains", () => {
  const catalog = buildSkillCatalog(P0_SKILLS);

  assert.ok(catalog.includes("## Available Financial Skills"), "Should have header");
  assert.ok(catalog.includes("Daily Intelligence"), "Should include Daily Intelligence domain");
  assert.ok(catalog.includes("Company Research"), "Should include Company Research domain");
  assert.ok(catalog.includes("morning-brief"), "Should list morning-brief");
  assert.ok(catalog.includes("market-health"), "Should list market-health");
  assert.ok(catalog.includes("deep-dive"), "Should list deep-dive");
  assert.ok(catalog.includes("fair-value"), "Should list fair-value");
  assert.ok(!catalog.includes("earnings-xray"), "Should NOT list P1 skills");
});

void test("buildSkillCatalog with P0+P1 skills includes all skills", () => {
  const catalog = buildSkillCatalog([...P0_SKILLS, ...P1_SKILLS]);

  assert.ok(catalog.includes("Daily Intelligence"), "Should include Daily Intelligence");
  assert.ok(catalog.includes("Company Research"), "Should include Company Research");
  assert.ok(catalog.includes("Setup Screening"), "Should include Setup Screening");
  assert.ok(catalog.includes("earnings-xray"), "Should list earnings-xray");
  assert.ok(catalog.includes("bull-bear"), "Should list bull-bear");
  assert.ok(catalog.includes("breakout-setups"), "Should list breakout-setups");
});

void test("buildSkillCatalog lists personas correctly", () => {
  const catalog = buildSkillCatalog([...P0_SKILLS, ...P1_SKILLS]);

  assert.ok(catalog.includes("fundamental-analyst"), "Should list fundamental-analyst");
  assert.ok(catalog.includes("macro-analyst"), "Should list macro-analyst");
  assert.ok(catalog.includes("technical-analyst"), "Should list technical-analyst");
  assert.ok(catalog.includes("Personas:"), "Should have Personas line");
});

void test("buildSkillCatalog with unknown skills puts them in Other", () => {
  const skills: BundledSkillEntry[] = [
    { id: "unknown-skill", category: "finance", path: "finance/unknown-skill" },
  ];
  const catalog = buildSkillCatalog(skills);

  assert.ok(catalog.includes("Other"), "Unknown skills go to Other domain");
  assert.ok(catalog.includes("unknown-skill"), "Should list the unknown skill");
});

void test("buildSkillCatalog with no skills returns empty string", () => {
  const catalog = buildSkillCatalog([]);
  assert.equal(catalog, "", "Empty skill list should produce empty catalog");
});

void test("buildSkillCatalog includes skill file path hints", () => {
  const catalog = buildSkillCatalog(P0_SKILLS);

  assert.ok(
    catalog.includes("./skills/finance/") || catalog.includes("skills/finance"),
    "Should reference skill file paths",
  );
  assert.ok(
    catalog.includes("./skills/personas/") || catalog.includes("skills/personas"),
    "Should reference persona paths",
  );
});

void test("buildSkillCatalog produces a table format", () => {
  const catalog = buildSkillCatalog(P0_SKILLS);

  assert.ok(catalog.includes("|"), "Should use table format");
  assert.ok(catalog.includes("Domain"), "Table should have Domain header");
  assert.ok(catalog.includes("Skills"), "Table should have Skills header");
});

void test("buildSkillCatalog does not interfere with Launchpad — catalog is pure text", () => {
  const catalog = buildSkillCatalog([...P0_SKILLS, ...P1_SKILLS]);

  // The catalog should be a string without any executable code or imports
  assert.equal(typeof catalog, "string");
  assert.ok(!catalog.includes("import "), "Should not contain import statements");
  assert.ok(!catalog.includes("require("), "Should not contain require statements");
});
