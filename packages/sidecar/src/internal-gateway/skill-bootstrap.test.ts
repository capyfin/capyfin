import assert from "node:assert/strict";
import {
  mkdtemp,
  readdir,
  readFile,
  rm,
  mkdir,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  installBundledSkills,
  installRemoteSkill,
  listBundledSkills,
  listInstalledSkills,
  removeSkill,
  SKILL_CATEGORIES,
} from "./skill-bootstrap.ts";

void test("listBundledSkills returns structured entries with category and path", async () => {
  const skills = await listBundledSkills();

  // With empty categories (no skills yet), list should be empty
  // Future tasks will add actual skills, making this length > 0
  assert.ok(Array.isArray(skills), "listBundledSkills should return an array");

  // Each entry should have the correct shape
  for (const skill of skills) {
    assert.ok(skill.id, "Entry should have an id");
    assert.ok(
      SKILL_CATEGORIES.includes(skill.category),
      `Category should be one of ${SKILL_CATEGORIES.join(", ")}`,
    );
    assert.equal(
      skill.path,
      `${skill.category}/${skill.id}`,
      "Path should be category/id",
    );
  }
});

void test("installBundledSkills creates category directories in workspace", async () => {
  const workspaceDir = await mkdtemp(join(tmpdir(), "capyfin-test-"));

  try {
    await installBundledSkills(workspaceDir);

    const skillsDir = join(workspaceDir, "skills");
    const entries = await readdir(skillsDir);

    assert.ok(
      entries.includes("finance"),
      "finance/ directory should exist in workspace",
    );
    assert.ok(
      entries.includes("personas"),
      "personas/ directory should exist in workspace",
    );
  } finally {
    await rm(workspaceDir, { recursive: true, force: true });
  }
});

void test("installBundledSkills is idempotent (overwrite without error)", async () => {
  const workspaceDir = await mkdtemp(join(tmpdir(), "capyfin-test-"));

  try {
    // First install
    await installBundledSkills(workspaceDir);

    // Second install should succeed without error
    const result = await installBundledSkills(workspaceDir);
    assert.ok(Array.isArray(result), "Should return array on repeated install");

    // Category directories should still exist
    const entries = await readdir(join(workspaceDir, "skills"));
    assert.ok(entries.includes("finance"));
    assert.ok(entries.includes("personas"));
  } finally {
    await rm(workspaceDir, { recursive: true, force: true });
  }
});

void test("listInstalledSkills discovers skills in nested category directories", async () => {
  const workspaceDir = await mkdtemp(join(tmpdir(), "capyfin-test-"));

  try {
    // Create a mock skill in finance/
    const skillDir = join(workspaceDir, "skills", "finance", "deep-dive");
    await mkdir(skillDir, { recursive: true });
    await writeFile(
      join(skillDir, "SKILL.md"),
      "---\nname: Deep Dive\n---\n\n# Deep Dive\n",
      "utf8",
    );

    const installed = await listInstalledSkills(workspaceDir);
    const deepDive = installed.find((s) => s.id === "deep-dive");
    assert.ok(deepDive, "deep-dive should be discovered");
    assert.equal(deepDive.category, "finance");
    assert.equal(deepDive.path, "finance/deep-dive");
  } finally {
    await rm(workspaceDir, { recursive: true, force: true });
  }
});

void test("listInstalledSkills discovers flat (ClawHub) skills alongside nested ones", async () => {
  const workspaceDir = await mkdtemp(join(tmpdir(), "capyfin-test-"));

  try {
    // Create a nested skill
    const nestedDir = join(workspaceDir, "skills", "finance", "fair-value");
    await mkdir(nestedDir, { recursive: true });
    await writeFile(
      join(nestedDir, "SKILL.md"),
      "---\nname: Fair Value\n---\n",
      "utf8",
    );

    // Create a flat (ClawHub) skill
    const flatDir = join(workspaceDir, "skills", "custom-tool");
    await mkdir(flatDir, { recursive: true });
    await writeFile(
      join(flatDir, "SKILL.md"),
      "---\nname: Custom Tool\n---\n",
      "utf8",
    );

    const installed = await listInstalledSkills(workspaceDir);

    const fairValue = installed.find((s) => s.id === "fair-value");
    assert.ok(fairValue, "Nested skill should be found");
    assert.equal(fairValue.category, "finance");
    assert.equal(fairValue.path, "finance/fair-value");

    const custom = installed.find((s) => s.id === "custom-tool");
    assert.ok(custom, "Flat skill should be found");
    assert.equal(
      custom.category,
      undefined,
      "Flat skill should not have a category",
    );
    assert.equal(custom.path, "custom-tool");
  } finally {
    await rm(workspaceDir, { recursive: true, force: true });
  }
});

void test("listInstalledSkills returns empty array when no skills directory", async () => {
  const workspaceDir = await mkdtemp(join(tmpdir(), "capyfin-test-"));

  try {
    const installed = await listInstalledSkills(workspaceDir);
    assert.deepEqual(installed, []);
  } finally {
    await rm(workspaceDir, { recursive: true, force: true });
  }
});

void test("removeSkill works with category-prefixed paths", async () => {
  const workspaceDir = await mkdtemp(join(tmpdir(), "capyfin-test-"));

  try {
    const skillDir = join(workspaceDir, "skills", "finance", "deep-dive");
    await mkdir(skillDir, { recursive: true });
    await writeFile(
      join(skillDir, "SKILL.md"),
      "---\nname: Deep Dive\n---\n",
      "utf8",
    );

    const removed = await removeSkill(workspaceDir, "finance/deep-dive");
    assert.equal(removed, true, "Should return true when skill is removed");

    // Verify it's gone
    const installed = await listInstalledSkills(workspaceDir);
    assert.ok(
      !installed.find((s) => s.path === "finance/deep-dive"),
      "Removed skill should not appear in list",
    );
  } finally {
    await rm(workspaceDir, { recursive: true, force: true });
  }
});

void test("removeSkill works with flat skill paths", async () => {
  const workspaceDir = await mkdtemp(join(tmpdir(), "capyfin-test-"));

  try {
    const skillDir = join(workspaceDir, "skills", "custom-skill");
    await mkdir(skillDir, { recursive: true });
    await writeFile(
      join(skillDir, "SKILL.md"),
      "---\nname: Custom\n---\n",
      "utf8",
    );

    const removed = await removeSkill(workspaceDir, "custom-skill");
    assert.equal(removed, true);
  } finally {
    await rm(workspaceDir, { recursive: true, force: true });
  }
});

void test("removeSkill returns false for nonexistent skill", async () => {
  const workspaceDir = await mkdtemp(join(tmpdir(), "capyfin-test-"));

  try {
    const removed = await removeSkill(workspaceDir, "finance/nonexistent");
    assert.equal(removed, false);
  } finally {
    await rm(workspaceDir, { recursive: true, force: true });
  }
});

void test("installRemoteSkill installs flat (no category prefix)", async () => {
  const workspaceDir = await mkdtemp(join(tmpdir(), "capyfin-test-"));

  try {
    const content = "---\nname: Remote Skill\n---\n\n# Remote\n";
    const skillDir = await installRemoteSkill(
      workspaceDir,
      "remote-skill",
      content,
    );

    const skillMd = await readFile(join(skillDir, "SKILL.md"), "utf8");
    assert.ok(skillMd.includes("Remote Skill"));

    // Should be discoverable as a flat skill
    const installed = await listInstalledSkills(workspaceDir);
    const remote = installed.find((s) => s.id === "remote-skill");
    assert.ok(remote, "Remote skill should be discovered");
    assert.equal(
      remote.category,
      undefined,
      "Remote skill should not have a category",
    );
    assert.equal(remote.path, "remote-skill");
  } finally {
    await rm(workspaceDir, { recursive: true, force: true });
  }
});
