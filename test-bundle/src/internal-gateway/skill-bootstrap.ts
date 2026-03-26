import { cp, mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const moduleDir = dirname(fileURLToPath(import.meta.url));
const BUNDLED_SKILLS_DIR = join(moduleDir, "..", "..", "skills");

/** Categories that contain bundled skills. */
export const SKILL_CATEGORIES = ["finance", "personas"] as const;
export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

export interface BundledSkillEntry {
  /** Skill directory name, e.g. "deep-dive" */
  id: string;
  /** Category the skill belongs to, e.g. "finance" */
  category: SkillCategory;
  /** Relative path including category, e.g. "finance/deep-dive" */
  path: string;
}

export interface InstalledSkillEntry {
  /** Skill directory name or full path */
  id: string;
  /** Category if the skill is inside a category directory */
  category?: SkillCategory;
  /** Relative path from skills/ root, e.g. "finance/deep-dive" or "custom-skill" */
  path: string;
}

async function dirExists(path: string): Promise<boolean> {
  try {
    const info = await stat(path);
    return info.isDirectory();
  } catch {
    return false;
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    const info = await stat(path);
    return info.isFile();
  } catch {
    return false;
  }
}

/**
 * Returns structured entries for all bundled skills.
 * Walks each category subdirectory and finds directories containing SKILL.md.
 */
export async function listBundledSkills(): Promise<BundledSkillEntry[]> {
  if (!(await dirExists(BUNDLED_SKILLS_DIR))) {
    return [];
  }

  const results: BundledSkillEntry[] = [];

  for (const category of SKILL_CATEGORIES) {
    const categoryDir = join(BUNDLED_SKILLS_DIR, category);
    if (!(await dirExists(categoryDir))) {
      continue;
    }

    const entries = await readdir(categoryDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }
      const skillMdPath = join(categoryDir, entry.name, "SKILL.md");
      if (await fileExists(skillMdPath)) {
        results.push({
          id: entry.name,
          category,
          path: `${category}/${entry.name}`,
        });
      }
    }
  }

  return results;
}

/**
 * Copy all bundled skills into an agent workspace's skills/ directory,
 * preserving the category directory structure.
 * Existing skill folders are overwritten so the user always gets the latest version.
 */
export async function installBundledSkills(
  workspaceDir: string,
): Promise<BundledSkillEntry[]> {
  const skills = await listBundledSkills();

  const targetSkillsDir = join(workspaceDir, "skills");

  // Always create category directories in the workspace even if empty
  for (const category of SKILL_CATEGORIES) {
    await mkdir(join(targetSkillsDir, category), { recursive: true });
  }

  if (skills.length === 0) {
    return [];
  }

  for (const skill of skills) {
    const source = join(BUNDLED_SKILLS_DIR, skill.category, skill.id);
    const destination = join(targetSkillsDir, skill.category, skill.id);
    await mkdir(dirname(destination), { recursive: true });
    await cp(source, destination, { recursive: true, force: true });
  }

  return skills;
}

/**
 * Install a remote skill into a workspace by writing its SKILL.md content.
 * Remote skills are installed flat (no category prefix).
 * Returns the path to the installed skill directory.
 */
export async function installRemoteSkill(
  workspaceDir: string,
  skillId: string,
  content: string,
): Promise<string> {
  const targetSkillsDir = join(workspaceDir, "skills");
  await mkdir(targetSkillsDir, { recursive: true });

  const skillDir = join(targetSkillsDir, skillId);
  await mkdir(skillDir, { recursive: true });

  const skillMdPath = join(skillDir, "SKILL.md");
  await writeFile(skillMdPath, content, "utf8");

  return skillDir;
}

/**
 * List all installed skills in a workspace's skills/ folder.
 * Discovers skills in both category subdirectories and flat (ClawHub/local) directories.
 */
export async function listInstalledSkills(
  workspaceDir: string,
): Promise<InstalledSkillEntry[]> {
  const skillsDir = join(workspaceDir, "skills");

  if (!(await dirExists(skillsDir))) {
    return [];
  }

  const results: InstalledSkillEntry[] = [];
  const categorySet = new Set<string>(SKILL_CATEGORIES);

  const topEntries = await readdir(skillsDir, { withFileTypes: true });
  for (const entry of topEntries) {
    if (!entry.isDirectory()) {
      continue;
    }

    if (categorySet.has(entry.name)) {
      // Walk inside the category directory
      const categoryDir = join(skillsDir, entry.name);
      const catEntries = await readdir(categoryDir, { withFileTypes: true });
      for (const catEntry of catEntries) {
        if (!catEntry.isDirectory()) {
          continue;
        }
        results.push({
          id: catEntry.name,
          category: entry.name as SkillCategory,
          path: `${entry.name}/${catEntry.name}`,
        });
      }
    } else {
      // Flat skill (ClawHub or local)
      results.push({
        id: entry.name,
        path: entry.name,
      });
    }
  }

  return results;
}

/**
 * Remove an installed skill from a workspace.
 * Accepts full path (e.g. "finance/deep-dive" or "custom-skill").
 * Returns true if the skill was found and removed, false otherwise.
 */
export async function removeSkill(
  workspaceDir: string,
  skillPath: string,
): Promise<boolean> {
  const skillDir = join(workspaceDir, "skills", skillPath);

  if (!(await dirExists(skillDir))) {
    return false;
  }

  await rm(skillDir, { recursive: true, force: true });
  return true;
}
