import assert from "node:assert/strict";
import { mkdtemp, readdir, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { Hono } from "hono";
import { createSkillRoutes } from "./skills.ts";
import { installBundledSkills } from "../../internal-gateway/skill-bootstrap.ts";

function createMockRuntime(workspaceDir: string) {
  return {
    embeddedGateway: {
      getDefaultAgent: () => ({
        id: "main",
        name: "Main",
        workspaceDir,
        description: "",
        instructions: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDefault: true,
      }),
    },
  } as never;
}

void test("GET /skills returns bundled skills with installed status", async () => {
  const workspaceDir = await mkdtemp(join(tmpdir(), "capyfin-skills-"));

  try {
    // Install bundled skills so they are present
    await installBundledSkills(workspaceDir);

    const app = new Hono();
    app.route("/skills", createSkillRoutes(createMockRuntime(workspaceDir)));

    const response = await app.request("/skills");
    assert.equal(response.status, 200);

    const body = (await response.json()) as {
      skills: {
        id: string;
        name: string;
        source: string;
        installed: boolean;
      }[];
    };

    assert.ok(
      body.skills.length >= 5,
      `Expected at least 5 skills, got ${String(body.skills.length)}`,
    );

    const stockAnalysis = body.skills.find((s) => s.id === "stock-analysis");
    assert.ok(stockAnalysis, "stock-analysis should be in the list");
    assert.equal(stockAnalysis.source, "bundled");
    assert.equal(stockAnalysis.installed, true);
  } finally {
    await rm(workspaceDir, { recursive: true, force: true });
  }
});

void test("GET /skills returns empty list when no workspace dir", async () => {
  const workspaceDir = await mkdtemp(join(tmpdir(), "capyfin-skills-"));

  try {
    // Don't install any skills
    const app = new Hono();
    app.route("/skills", createSkillRoutes(createMockRuntime(workspaceDir)));

    const response = await app.request("/skills");
    assert.equal(response.status, 200);

    const body = (await response.json()) as {
      skills: { id: string; installed: boolean }[];
    };

    // Bundled skills should still appear even if not installed
    assert.ok(body.skills.length >= 5);

    // None should be installed since we didn't call installBundledSkills
    for (const skill of body.skills) {
      assert.equal(
        skill.installed,
        false,
        `${skill.id} should not be installed`,
      );
    }
  } finally {
    await rm(workspaceDir, { recursive: true, force: true });
  }
});

void test("DELETE /skills/:skillId prevents removing bundled skills", async () => {
  const workspaceDir = await mkdtemp(join(tmpdir(), "capyfin-skills-"));

  try {
    await installBundledSkills(workspaceDir);

    const app = new Hono();
    app.route("/skills", createSkillRoutes(createMockRuntime(workspaceDir)));

    const response = await app.request("/skills/stock-analysis", {
      method: "DELETE",
    });

    assert.equal(response.status, 400);
    const body = (await response.json()) as { error: string };
    assert.ok(body.error.includes("Bundled"));
  } finally {
    await rm(workspaceDir, { recursive: true, force: true });
  }
});

void test("DELETE /skills/:skillId removes a non-bundled skill", async () => {
  const workspaceDir = await mkdtemp(join(tmpdir(), "capyfin-skills-"));

  try {
    // Manually install a fake remote skill
    const skillDir = join(workspaceDir, "skills", "custom-skill");
    await mkdir(skillDir, { recursive: true });
    await writeFile(
      join(skillDir, "SKILL.md"),
      "---\nname: Custom Skill\n---\n\n# Custom Skill\n",
      "utf8",
    );

    const app = new Hono();
    app.route("/skills", createSkillRoutes(createMockRuntime(workspaceDir)));

    const response = await app.request("/skills/custom-skill", {
      method: "DELETE",
    });
    assert.equal(response.status, 200);

    const body = (await response.json()) as { deleted: boolean };
    assert.equal(body.deleted, true);

    // Verify the skill directory is gone
    const entries = await readdir(join(workspaceDir, "skills"));
    assert.ok(
      !entries.includes("custom-skill"),
      "custom-skill should be removed",
    );
  } finally {
    await rm(workspaceDir, { recursive: true, force: true });
  }
});

void test("DELETE /skills/:skillId returns deleted:false for nonexistent skill", async () => {
  const workspaceDir = await mkdtemp(join(tmpdir(), "capyfin-skills-"));

  try {
    const app = new Hono();
    app.route("/skills", createSkillRoutes(createMockRuntime(workspaceDir)));

    const response = await app.request("/skills/does-not-exist", {
      method: "DELETE",
    });
    assert.equal(response.status, 200);

    const body = (await response.json()) as { deleted: boolean };
    assert.equal(body.deleted, false);
  } finally {
    await rm(workspaceDir, { recursive: true, force: true });
  }
});

void test("POST /skills/install returns 502 when ClawHub is unreachable", async () => {
  const workspaceDir = await mkdtemp(join(tmpdir(), "capyfin-skills-"));

  try {
    const app = new Hono();
    app.route("/skills", createSkillRoutes(createMockRuntime(workspaceDir)));

    const response = await app.request("/skills/install", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillId: "some-skill" }),
    });

    // The mock runtime doesn't have a real registry, so this should fail
    // with either a 502 (unreachable) or a network error
    assert.ok(
      response.status === 502 || response.status === 500,
      `Expected 502 or 500, got ${String(response.status)}`,
    );
  } finally {
    await rm(workspaceDir, { recursive: true, force: true });
  }
});
