import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const moduleDir = dirname(fileURLToPath(import.meta.url));

const SKILLS = [
  {
    id: "morning-brief",
    expectedName: "Morning Brief",
    minLines: 300,
    expectedRequires: ["web_search", "fetch", "read_file"],
    requiredSections: [
      "Purpose",
      "Data Sourcing",
      "Tier 0",
      "Tier 1",
      "Watchlist",
      "Analysis",
      "Output Template",
      "Market Regime",
      "Index Performance",
      "Earnings",
      "Sector Rotation",
      "Key News",
      "Conditional Logic",
      "Data Freshness",
      "Citations",
      "Quality",
    ],
    requiredContent: [
      "macro-analyst",
      "watchlist.csv",
      "S&P 500",
      "NASDAQ",
      "web search",
      "FMP",
      "risk-on",
      "risk-off",
      "offensive",
      "defensive",
      "HIGH",
      "MEDIUM",
      "LOW",
      "cron",
      "provider",
    ],
  },
  {
    id: "market-health",
    expectedName: "Market Health",
    minLines: 300,
    expectedRequires: ["web_search", "fetch"],
    requiredSections: [
      "Purpose",
      "Data Sourcing",
      "Tier 0",
      "Tier 1",
      "Market Direction",
      "Distribution Day",
      "Follow-Through Day",
      "Breadth",
      "Regime",
      "Confirmed Uptrend",
      "Uptrend Under Pressure",
      "Rally Attempt",
      "Downtrend",
      "Composite Score",
      "Output Template",
      "Regime Verdict",
      "Component Breakdown",
      "What Changed",
      "Exposure Guidance",
      "Quality",
    ],
    requiredContent: [
      "macro-analyst",
      "distribution day",
      "0-100",
      "S&P 500",
      "200-day",
      "50-day",
      "advance/decline",
      "VIX",
      "web search",
      "FMP",
      "offensive",
      "defensive",
      "provider",
    ],
  },
] as const;

for (const skill of SKILLS) {
  const skillPath = join(moduleDir, skill.id, "SKILL.md");

  void test(`${skill.id}/SKILL.md exists`, async () => {
    const info = await stat(skillPath);
    assert.ok(info.isFile(), `${skillPath} should be a file`);
  });

  void test(`${skill.id}/SKILL.md has valid YAML frontmatter with required fields`, async () => {
    const content = await readFile(skillPath, "utf8");
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    assert.ok(frontmatterMatch, "File should start with YAML frontmatter");

    const frontmatter = frontmatterMatch[1];
    assert.ok(
      frontmatter.includes(`name: ${skill.expectedName}`),
      `Frontmatter should include name: ${skill.expectedName}`,
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

  void test(`${skill.id}/SKILL.md declares required tool capabilities`, async () => {
    const content = await readFile(skillPath, "utf8");
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    assert.ok(frontmatterMatch, "File should start with YAML frontmatter");

    const frontmatter = frontmatterMatch[1];
    for (const req of skill.expectedRequires) {
      assert.ok(
        frontmatter.includes(req),
        `Frontmatter requires should include "${req}"`,
      );
    }
  });

  void test(`${skill.id}/SKILL.md is ${skill.minLines}+ lines`, async () => {
    const content = await readFile(skillPath, "utf8");
    const lineCount = content.split("\n").length;
    assert.ok(
      lineCount >= skill.minLines,
      `File should be ${skill.minLines}+ lines, got ${lineCount}`,
    );
  });

  void test(`${skill.id}/SKILL.md contains required content sections`, async () => {
    const content = await readFile(skillPath, "utf8");
    for (const section of skill.requiredSections) {
      assert.ok(
        content.includes(section),
        `File should contain section or mention of "${section}"`,
      );
    }
  });

  void test(`${skill.id}/SKILL.md contains required domain keywords`, async () => {
    const content = await readFile(skillPath, "utf8");
    const contentLower = content.toLowerCase();
    for (const keyword of skill.requiredContent) {
      assert.ok(
        contentLower.includes(keyword.toLowerCase()),
        `File should contain keyword "${keyword}"`,
      );
    }
  });

  void test(`${skill.id}/SKILL.md includes tier 0 provider nudge`, async () => {
    const content = await readFile(skillPath, "utf8");
    assert.ok(
      content.includes("FMP") && content.includes("Settings") && content.includes("Providers"),
      "File should include the organic FMP provider nudge referencing Settings → Providers",
    );
  });

  void test(`${skill.id}/SKILL.md works at Tier 0 (web search only)`, async () => {
    const content = await readFile(skillPath, "utf8");
    const contentLower = content.toLowerCase();
    assert.ok(
      contentLower.includes("tier 0") && contentLower.includes("web search"),
      "File should describe Tier 0 web-search-only operation",
    );
    assert.ok(
      contentLower.includes("no api") || contentLower.includes("no key") || contentLower.includes("zero configuration") || contentLower.includes("always available"),
      "File should indicate Tier 0 requires no API keys",
    );
  });

  void test(`${skill.id}/SKILL.md defines exact output format`, async () => {
    const content = await readFile(skillPath, "utf8");
    assert.ok(
      content.includes("## Output Template") || content.includes("## Output Format"),
      "File should have an Output Template or Output Format section",
    );
  });
}
