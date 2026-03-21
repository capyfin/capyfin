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
  {
    id: "deep-dive",
    expectedName: "Deep Dive",
    minLines: 300,
    expectedRequires: ["web_search", "fetch"],
    requiredSections: [
      "Purpose",
      "Data Sourcing",
      "Tier 0",
      "Tier 1",
      "Business Overview",
      "Moat Assessment",
      "Financial Health",
      "Recent Developments",
      "Key Risks",
      "Verdict",
      "Output Template",
      "Quality",
    ],
    requiredContent: [
      "fundamental-analyst",
      "SEC EDGAR",
      "10-K",
      "10-Q",
      "network effects",
      "switching costs",
      "cost advantages",
      "intangible assets",
      "efficient scale",
      "moat-framework.md",
      "revenue growth",
      "free cash flow",
      "web search",
      "FMP",
      "HIGH",
      "MEDIUM",
      "LOW",
      "provider",
      "None",
      "Narrow",
      "Wide",
    ],
  },
  {
    id: "fair-value",
    expectedName: "Fair Value",
    minLines: 300,
    expectedRequires: ["web_search", "fetch"],
    requiredSections: [
      "Purpose",
      "Data Sourcing",
      "Tier 0",
      "Tier 1",
      "Current Price",
      "DCF",
      "Comparable",
      "Analyst Price Targets",
      "Verdict",
      "Output Template",
      "Quality",
    ],
    requiredContent: [
      "fundamental-analyst",
      "dcf-methodology.md",
      "WACC",
      "terminal value",
      "sensitivity",
      "EV/EBITDA",
      "P/E",
      "P/S",
      "SEC EDGAR",
      "web search",
      "FMP",
      "15%",
      "provider",
      "fair value range",
    ],
  },
] as const;

const REFERENCE_DOCS = [
  {
    skillId: "deep-dive",
    path: "deep-dive/references/moat-framework.md",
    minLines: 80,
    requiredContent: [
      "network effects",
      "switching costs",
      "cost advantages",
      "intangible assets",
      "efficient scale",
      "None",
      "Narrow",
      "Wide",
    ],
  },
  {
    skillId: "fair-value",
    path: "fair-value/references/dcf-methodology.md",
    minLines: 100,
    requiredContent: [
      "free cash flow",
      "WACC",
      "terminal value",
      "discount",
      "sensitivity",
      "15%",
      "growth rate",
      "present value",
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

// Reference document tests
for (const ref of REFERENCE_DOCS) {
  const refPath = join(moduleDir, ref.path);

  void test(`${ref.path} exists`, async () => {
    const info = await stat(refPath);
    assert.ok(info.isFile(), `${refPath} should be a file`);
  });

  void test(`${ref.path} is ${ref.minLines}+ lines`, async () => {
    const content = await readFile(refPath, "utf8");
    const lineCount = content.split("\n").length;
    assert.ok(
      lineCount >= ref.minLines,
      `File should be ${ref.minLines}+ lines, got ${lineCount}`,
    );
  });

  void test(`${ref.path} contains required domain keywords`, async () => {
    const content = await readFile(refPath, "utf8");
    const contentLower = content.toLowerCase();
    for (const keyword of ref.requiredContent) {
      assert.ok(
        contentLower.includes(keyword.toLowerCase()),
        `File should contain keyword "${keyword}"`,
      );
    }
  });
}

// Deep-dive specific: references moat-framework.md
void test("deep-dive/SKILL.md references moat-framework.md", async () => {
  const content = await readFile(join(moduleDir, "deep-dive", "SKILL.md"), "utf8");
  assert.ok(
    content.includes("references/moat-framework.md"),
    "Deep Dive skill should reference references/moat-framework.md",
  );
});

// Fair-value specific: references dcf-methodology.md
void test("fair-value/SKILL.md references dcf-methodology.md", async () => {
  const content = await readFile(join(moduleDir, "fair-value", "SKILL.md"), "utf8");
  assert.ok(
    content.includes("references/dcf-methodology.md"),
    "Fair Value skill should reference references/dcf-methodology.md",
  );
});

// Data freshness footer test for research skills
for (const id of ["deep-dive", "fair-value"] as const) {
  void test(`${id}/SKILL.md includes data freshness footer format`, async () => {
    const content = await readFile(join(moduleDir, id, "SKILL.md"), "utf8");
    assert.ok(
      content.includes("Data as of:") && content.includes("Sources:") && content.includes("Tier:"),
      "File should include the data freshness footer format",
    );
  });
}
