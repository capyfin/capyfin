import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { installBundledSkills, listBundledSkills } from "./skill-bootstrap.ts";

void test("listBundledSkills returns the bundled financial skill names", async () => {
  const skills = await listBundledSkills();

  assert.ok(skills.length >= 5, `Expected at least 5 skills, got ${String(skills.length)}`);
  assert.ok(skills.includes("stock-analysis"), "Missing stock-analysis skill");
  assert.ok(skills.includes("portfolio-analyzer"), "Missing portfolio-analyzer skill");
  assert.ok(skills.includes("earnings-summary"), "Missing earnings-summary skill");
  assert.ok(skills.includes("market-screener"), "Missing market-screener skill");
  assert.ok(skills.includes("market-overview"), "Missing market-overview skill");
});

void test("installBundledSkills copies skills to the workspace", async () => {
  const workspaceDir = await mkdtemp(join(tmpdir(), "capyfin-test-"));

  try {
    const installed = await installBundledSkills(workspaceDir);

    assert.ok(installed.length >= 5, `Expected at least 5 installed, got ${String(installed.length)}`);

    const skillsDir = join(workspaceDir, "skills");
    const entries = await readdir(skillsDir);
    assert.ok(entries.includes("stock-analysis"), "stock-analysis not copied");
    assert.ok(entries.includes("portfolio-analyzer"), "portfolio-analyzer not copied");

    // Verify SKILL.md exists in a copied skill
    const skillMd = await readFile(
      join(skillsDir, "stock-analysis", "SKILL.md"),
      "utf8",
    );
    assert.ok(skillMd.includes("Stock Analysis"), "SKILL.md content incorrect");
  } finally {
    await rm(workspaceDir, { recursive: true, force: true });
  }
});

void test("installBundledSkills overwrites existing skills", async () => {
  const workspaceDir = await mkdtemp(join(tmpdir(), "capyfin-test-"));

  try {
    // First install
    await installBundledSkills(workspaceDir);

    // Second install (should overwrite without error)
    const installed = await installBundledSkills(workspaceDir);
    assert.ok(installed.length >= 5);

    // Skills should still be there
    const skillMd = await readFile(
      join(workspaceDir, "skills", "stock-analysis", "SKILL.md"),
      "utf8",
    );
    assert.ok(skillMd.includes("Stock Analysis"));
  } finally {
    await rm(workspaceDir, { recursive: true, force: true });
  }
});
