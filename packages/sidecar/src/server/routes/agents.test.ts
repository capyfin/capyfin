import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { AgentService } from "@capyfin/core/agents";
import { ProviderAuthService } from "@capyfin/core/auth";
import { OAuthSessionManager } from "../../auth/oauth-sessions.ts";
import { createAgentRoutes } from "./agents.ts";

async function createStorePath(prefix: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), `${prefix}-`));
  return join(directory, "catalog.json");
}

void test("agent routes manage agents and create sessions", async (context) => {
  const storePath = await createStorePath("capyfin-agents-route");
  const createAgentService = (): AgentService =>
    new AgentService({ storePath });
  const createAuthService = (): ProviderAuthService =>
    new ProviderAuthService({ storePath: join(dirname(storePath), "auth.json") });
  const runtime = {
    authSessions: new OAuthSessionManager(createAuthService),
    config: {
      hostname: "127.0.0.1",
      password: "password",
      port: 3000,
      username: "capyfin",
    },
    createAgentService,
    createAuthService,
    startedAt: Date.now(),
    version: "0.1.0-test",
  };
  const app = createAgentRoutes(runtime);

  context.after(async () => {
    await rm(dirname(storePath), { force: true, recursive: true });
  });

  const createResponse = await app.request("/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Research",
      providerId: "openai",
      modelId: "gpt-5",
    }),
  });
  assert.equal(createResponse.status, 201);

  const catalogResponse = await app.request("/");
  assert.equal(catalogResponse.status, 200);
  const catalog = (await catalogResponse.json()) as {
    agents: { id: string }[];
  };
  assert.ok(catalog.agents.some((agent) => agent.id === "research"));

  const sessionResponse = await app.request("/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      agentId: "research",
      label: "Market open",
    }),
  });
  assert.equal(sessionResponse.status, 201);

  const sessionsResponse = await app.request("/sessions?agentId=research");
  assert.equal(sessionsResponse.status, 200);
  const sessions = (await sessionsResponse.json()) as {
    sessions: { agentId: string; label?: string }[];
  };
  assert.equal(sessions.sessions.length, 1);
  const createdSession = sessions.sessions[0];
  assert.ok(createdSession);
  assert.equal(createdSession.agentId, "research");
  assert.equal(createdSession.label, "Market open");
});
