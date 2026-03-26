import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { AgentMetadataStoreService } from "./metadata-store.ts";
import type { EmbeddedGatewayPaths } from "./paths.ts";

function createTestPaths(baseDir: string): EmbeddedGatewayPaths {
  return {
    configDir: join(baseDir, "config"),
    configPath: join(baseDir, "config", "openclaw.json"),
    deviceIdentityPath: join(baseDir, "identity", "device.json"),
    logsDir: join(baseDir, "logs"),
    metadataPath: join(baseDir, "agent-metadata.json"),
    oauthDir: join(baseDir, "oauth"),
    rootDir: baseDir,
    stateDir: join(baseDir, "state"),
    tokenPath: join(baseDir, "gateway-token"),
    workspacesDir: join(baseDir, "workspaces"),
  };
}

void test("ensureDefaultAgent creates agent with user-facing description", async (context) => {
  const baseDir = await mkdtemp(join(tmpdir(), "capyfin-metadata-"));
  context.after(async () => {
    await rm(baseDir, { force: true, recursive: true });
  });

  const paths = createTestPaths(baseDir);
  const service = new AgentMetadataStoreService(paths);
  const agent = await service.ensureDefaultAgent();

  assert.ok(agent.description, "Default agent should have a description");

  const jargonTerms = ["orchestration", "orchestrator", "default workspace"];
  for (const term of jargonTerms) {
    assert.ok(
      !agent.description.toLowerCase().includes(term),
      `Default agent description should not contain developer jargon "${term}"`,
    );
  }
});
