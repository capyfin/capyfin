import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const moduleDir = dirname(fileURLToPath(import.meta.url));

const PERSONAS = [
  {
    id: "fundamental-analyst",
    expectedName: "Fundamental Analyst",
    requiredSections: [
      "Identity",
      "Mindset",
      "Framework",
      "Quality Standards",
      "Evidence",
      "Anti-Patterns",
      "Reasoning",
    ],
    requiredContent: [
      "moat",
      "GAAP",
      "non-GAAP",
      "one-time items",
      "5-year",
      "debt",
      "dilution",
      "free cash flow",
      "valuation",
      "assumptions",
      "SEC",
      "10-K",
      "margin",
    ],
  },
  {
    id: "macro-analyst",
    expectedName: "Macro Analyst",
    requiredSections: [
      "Identity",
      "Mindset",
      "Framework",
      "Indicators",
      "Regime",
      "Sector Rotation",
      "Quality Standards",
      "Anti-Patterns",
      "Reasoning",
    ],
    requiredContent: [
      "Fed funds rate",
      "CPI",
      "PMI",
      "expansion",
      "contraction",
      "sector rotation",
      "yield curve",
      "interest rate",
      "GDP",
      "employment",
    ],
  },
  {
    id: "technical-analyst",
    expectedName: "Technical Analyst",
    requiredSections: [
      "Identity",
      "Mindset",
      "Framework",
      "Market Structure",
      "Indicators",
      "Quality Standards",
      "Anti-Patterns",
      "Reasoning",
    ],
    requiredContent: [
      "price action",
      "volume",
      "VCP",
      "cup-and-handle",
      "double bottom",
      "invalidation",
      "moving average",
      "breakout",
      "relative strength",
      "distribution day",
    ],
  },
] as const;

for (const persona of PERSONAS) {
  const skillPath = join(moduleDir, persona.id, "SKILL.md");

  void test(`${persona.id}/SKILL.md exists`, async () => {
    const info = await stat(skillPath);
    assert.ok(info.isFile(), `${skillPath} should be a file`);
  });

  void test(`${persona.id}/SKILL.md has valid YAML frontmatter with required fields`, async () => {
    const content = await readFile(skillPath, "utf8");
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    assert.ok(frontmatterMatch, "File should start with YAML frontmatter");

    const frontmatter = frontmatterMatch[1];
    assert.ok(
      frontmatter.includes(`name: ${persona.expectedName}`),
      `Frontmatter should include name: ${persona.expectedName}`,
    );
    assert.ok(
      frontmatter.includes("description:"),
      "Frontmatter should include description",
    );
    assert.ok(
      frontmatter.includes("version: 0.1.0"),
      "Frontmatter should include version: 0.1.0",
    );
    assert.ok(
      frontmatter.includes("disable-model-invocation: true"),
      "Frontmatter should include disable-model-invocation: true",
    );
  });

  void test(`${persona.id}/SKILL.md is 150+ lines`, async () => {
    const content = await readFile(skillPath, "utf8");
    const lineCount = content.split("\n").length;
    assert.ok(
      lineCount >= 150,
      `File should be 150+ lines, got ${lineCount}`,
    );
  });

  void test(`${persona.id}/SKILL.md contains required content sections`, async () => {
    const content = await readFile(skillPath, "utf8");
    for (const section of persona.requiredSections) {
      assert.ok(
        content.includes(section),
        `File should contain section or mention of "${section}"`,
      );
    }
  });

  void test(`${persona.id}/SKILL.md contains required domain keywords`, async () => {
    const content = await readFile(skillPath, "utf8");
    const contentLower = content.toLowerCase();
    for (const keyword of persona.requiredContent) {
      assert.ok(
        contentLower.includes(keyword.toLowerCase()),
        `File should contain keyword "${keyword}"`,
      );
    }
  });

  void test(`${persona.id}/SKILL.md is self-contained (no output format references)`, async () => {
    const content = await readFile(skillPath, "utf8");
    // Personas should not define output formats — those are defined by skills
    assert.ok(
      !content.includes("## Output Format"),
      "Persona should not define an output format section",
    );
    assert.ok(
      !content.includes("## Output Template"),
      "Persona should not define an output template section",
    );
  });
}
