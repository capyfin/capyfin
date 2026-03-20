import { cp, mkdir, readdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const moduleDir = dirname(fileURLToPath(import.meta.url));
const BUNDLED_SKILLS_DIR = join(moduleDir, "..", "..", "skills");

async function dirExists(path: string): Promise<boolean> {
  try {
    const info = await stat(path);
    return info.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Returns the list of bundled skill directory names
 * (each contains a SKILL.md).
 */
export async function listBundledSkills(): Promise<string[]> {
  if (!(await dirExists(BUNDLED_SKILLS_DIR))) {
    return [];
  }

  const entries = await readdir(BUNDLED_SKILLS_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

/**
 * Copy all bundled financial skills into an agent workspace's skills/ directory.
 * Existing skill folders are overwritten so the user always gets the latest version.
 */
export async function installBundledSkills(
  workspaceDir: string,
): Promise<string[]> {
  const skillNames = await listBundledSkills();
  if (skillNames.length === 0) {
    return [];
  }

  const targetSkillsDir = join(workspaceDir, "skills");
  await mkdir(targetSkillsDir, { recursive: true });

  const installed: string[] = [];
  for (const name of skillNames) {
    const source = join(BUNDLED_SKILLS_DIR, name);
    const destination = join(targetSkillsDir, name);
    await cp(source, destination, { recursive: true, force: true });
    installed.push(name);
  }

  return installed;
}
