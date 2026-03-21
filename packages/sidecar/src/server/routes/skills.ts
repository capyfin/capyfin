import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Hono } from "hono";
import { z } from "zod";
import type { SkillManifest } from "@capyfin/contracts";
import type { SidecarRuntime } from "../context.ts";
import {
  listBundledSkills,
  listInstalledSkills,
  installRemoteSkill,
  removeSkill,
} from "../../internal-gateway/skill-bootstrap.ts";
import {
  ClawHubClient,
  type ClawHubSkillManifest,
} from "../../internal-gateway/clawhub-client.ts";

const installSkillBodySchema = z.object({
  skillId: z.string().min(1),
});

function parseSkillMdFrontMatter(content: string): {
  name?: string;
  description?: string;
  version?: string;
} {
  if (!content.startsWith("---")) {
    return {};
  }

  const endIndex = content.indexOf("\n---", 3);
  if (endIndex === -1) {
    return {};
  }

  const frontMatter = content.slice(3, endIndex);
  const result: { name?: string; description?: string; version?: string } = {};

  for (const line of frontMatter.split("\n")) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) {
      continue;
    }
    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();
    if (key === "name") {
      result.name = value;
    } else if (key === "description") {
      result.description = value;
    } else if (key === "version") {
      result.version = value;
    }
  }

  return result;
}

export function createSkillRoutes(runtime: SidecarRuntime): Hono {
  const app = new Hono();
  const clawHubClient = new ClawHubClient();

  // GET /skills - list all skills (bundled + clawhub) with installed status
  app.get("/", async (context) => {
    const agent = await runtime.embeddedGateway.getDefaultAgent();
    const workspaceDir = agent.workspaceDir;

    const installedSkillIds = workspaceDir
      ? await listInstalledSkills(workspaceDir)
      : [];
    const installedSet = new Set(installedSkillIds);

    const skills: SkillManifest[] = [];

    // Add bundled skills
    const bundledIds = await listBundledSkills();
    for (const id of bundledIds) {
      let name = id;
      let description: string | undefined;
      let version: string | undefined;

      try {
        const skillMdPath = join(workspaceDir, "skills", id, "SKILL.md");
        const content = await readFile(skillMdPath, "utf8");
        const parsed = parseSkillMdFrontMatter(content);
        name = parsed.name ?? id;
        description = parsed.description;
        version = parsed.version;
      } catch {
        // Skill may not be installed yet; use id as name
      }

      skills.push({
        id,
        name,
        description,
        version,
        source: "bundled",
        installed: installedSet.has(id),
      });
    }

    // Try to fetch ClawHub skills, gracefully degrade on failure
    let clawHubSkills: ClawHubSkillManifest[] = [];
    try {
      clawHubSkills = await clawHubClient.listSkills();
    } catch {
      // ClawHub unavailable — return bundled-only list
    }

    for (const hubSkill of clawHubSkills) {
      // Skip if already listed as a bundled skill
      if (skills.some((s) => s.id === hubSkill.id)) {
        continue;
      }

      skills.push({
        id: hubSkill.id,
        name: hubSkill.name,
        description: hubSkill.description,
        version: hubSkill.version,
        source: "clawhub",
        installed: installedSet.has(hubSkill.id),
      });
    }

    return context.json({ skills });
  });

  // POST /skills/install - install a skill from ClawHub
  app.post("/install", async (context) => {
    const agent = await runtime.embeddedGateway.getDefaultAgent();

    if (!agent.workspaceDir) {
      return context.json({ error: "Agent has no workspace directory." }, 400);
    }

    const payload = installSkillBodySchema.parse(await context.req.json());

    // Try to find in ClawHub and download
    let clawHubSkills: ClawHubSkillManifest[] = [];
    try {
      clawHubSkills = await clawHubClient.listSkills();
    } catch {
      return context.json({ error: "ClawHub registry is not reachable." }, 502);
    }

    const skill = clawHubSkills.find((s) => s.id === payload.skillId);
    if (!skill) {
      return context.json(
        { error: `Skill "${payload.skillId}" not found in ClawHub registry.` },
        404,
      );
    }

    // Download the skill content
    let content: string;
    try {
      const response = await fetch(skill.downloadUrl, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        return context.json(
          {
            error: `Failed to download skill: status ${String(response.status)}`,
          },
          502,
        );
      }
      content = await response.text();
    } catch {
      return context.json({ error: "Failed to download skill content." }, 502);
    }

    const skillDir = await installRemoteSkill(
      agent.workspaceDir,
      payload.skillId,
      content,
    );

    return context.json(
      {
        message: `Skill "${payload.skillId}" installed successfully.`,
        skillId: payload.skillId,
        path: skillDir,
      },
      201,
    );
  });

  // DELETE /skills/:skillId - remove an installed skill
  app.delete("/:skillId", async (context) => {
    const skillId = context.req.param("skillId");
    const agent = await runtime.embeddedGateway.getDefaultAgent();

    if (!agent.workspaceDir) {
      return context.json({ deleted: false });
    }

    // Prevent removing bundled skills
    const bundledIds = await listBundledSkills();
    if (bundledIds.includes(skillId)) {
      return context.json({ error: "Bundled skills cannot be removed." }, 400);
    }

    const deleted = await removeSkill(agent.workspaceDir, skillId);
    return context.json({ deleted });
  });

  return app;
}
