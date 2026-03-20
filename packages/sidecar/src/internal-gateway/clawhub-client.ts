import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export interface ClawHubSkillManifest {
  id: string;
  name: string;
  description?: string;
  version: string;
  downloadUrl: string;
  checksum?: string;
}

export interface ClawHubRegistryResponse {
  skills: ClawHubSkillManifest[];
}

const DEFAULT_REGISTRY_URL =
  process.env.CAPYFIN_CLAWHUB_REGISTRY_URL ??
  "https://registry.clawhub.dev/v1";

const DEFAULT_TIMEOUT_MS = 10_000;

export class ClawHubClient {
  private readonly registryUrl: string;
  private readonly timeoutMs: number;

  constructor(options?: { registryUrl?: string; timeoutMs?: number }) {
    this.registryUrl = options?.registryUrl ?? DEFAULT_REGISTRY_URL;
    this.timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async listSkills(): Promise<ClawHubSkillManifest[]> {
    const response = await fetch(`${this.registryUrl}/skills`, {
      signal: AbortSignal.timeout(this.timeoutMs),
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(
        `ClawHub registry returned status ${String(response.status)}`,
      );
    }

    const body = (await response.json()) as ClawHubRegistryResponse;
    return body.skills;
  }

  async downloadSkill(
    skill: ClawHubSkillManifest,
    targetDir: string,
  ): Promise<string> {
    const response = await fetch(skill.downloadUrl, {
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to download skill "${skill.id}": status ${String(response.status)}`,
      );
    }

    const content = await response.text();
    const skillDir = join(targetDir, skill.id);
    await mkdir(skillDir, { recursive: true });

    const skillMdPath = join(skillDir, "SKILL.md");
    await writeFile(skillMdPath, content, "utf8");

    return skillDir;
  }

  async downloadSkillById(
    skillId: string,
    targetDir: string,
  ): Promise<string> {
    const skills = await this.listSkills();
    const skill = skills.find((s) => s.id === skillId);

    if (!skill) {
      throw new Error(`Skill "${skillId}" not found in ClawHub registry.`);
    }

    return this.downloadSkill(skill, targetDir);
  }
}
