import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { ProviderAuthService } from "@capyfin/core/auth";
import { OAuthSessionManager } from "../../auth/oauth-sessions.ts";
import { createAuthRoutes } from "./auth.ts";

async function createStorePath(prefix: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), `${prefix}-`));
  return join(directory, "auth-profiles.json");
}

void test("auth routes expose overview and store credentials", async (context) => {
  const storePath = await createStorePath("capyfin-sidecar");
  const createAuthService = (): ProviderAuthService =>
    new ProviderAuthService({ storePath });
  const runtime = {
    authSessions: new OAuthSessionManager(createAuthService),
    config: {
      hostname: "127.0.0.1",
      password: "password",
      port: 3000,
      username: "capyfin",
    },
    createAuthService,
    startedAt: Date.now(),
    version: "0.1.0-test",
  };
  const app = createAuthRoutes(runtime);

  context.after(async () => {
    await rm(dirname(storePath), { force: true, recursive: true });
  });

  const overviewResponse = await app.request("/overview");
  assert.equal(overviewResponse.status, 200);

  const connectResponse = await app.request("/credentials", {
    body: JSON.stringify({
      providerId: "openai",
      secret: "sk-test",
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  assert.equal(connectResponse.status, 201);

  const selectResponse = await app.request("/select", {
    body: JSON.stringify({
      selector: "openai",
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  assert.equal(selectResponse.status, 200);

  const selected = (await selectResponse.json()) as {
    isSelectedProvider: boolean;
    selectedProfileId?: string;
  };
  assert.equal(selected.isSelectedProvider, true);
  assert.equal(selected.selectedProfileId, "openai:default");
});
