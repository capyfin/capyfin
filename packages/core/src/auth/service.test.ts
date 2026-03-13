import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { registerOAuthProvider, unregisterOAuthProvider } from "@mariozechner/pi-ai/oauth";
import { loadAuthBridge } from "./bridge.ts";
import { ProviderAuthService } from "./service.ts";

function createStorePath(prefix: string): Promise<string> {
  return mkdtemp(join(tmpdir(), `${prefix}-`)).then((directory) =>
    join(directory, "auth-profiles.json"),
  );
}

void test("stores and selects a static provider profile", async (context) => {
  const storePath = await createStorePath("capyfin-auth");
  const service = new ProviderAuthService({ storePath });

  context.after(async () => {
    await rm(dirname(storePath), { force: true, recursive: true });
  });

  const summary = await service.saveSecretProfile({
    providerId: "openai",
    secret: "sk-test",
  });

  assert.equal(summary.profileId, "openai:default");
  assert.equal(summary.type, "api_key");

  const overview = await service.getOverview();
  const openaiStatus = overview.providers.find(
    (provider) => provider.provider.id === "openai",
  );

  assert.ok(openaiStatus);
  assert.ok(openaiStatus.resolved);
  assert.equal(overview.selectedProviderId, "openai");
  assert.equal(overview.selectedProfileId, "openai:default");
  assert.equal(openaiStatus.selectedProfileId, "openai:default");
  assert.equal(openaiStatus.resolved.source, "profile");

  const authBridge = await loadAuthBridge(storePath);
  assert.deepEqual(authBridge.openai, {
    key: "sk-test",
    type: "api_key",
  });
});

void test("supports selecting a provider from environment credentials", async (context) => {
  const storePath = await createStorePath("capyfin-auth");
  const service = new ProviderAuthService({
    env: {
      OPENAI_API_KEY: "sk-env",
    },
    storePath,
  });

  context.after(async () => {
    await rm(dirname(storePath), { force: true, recursive: true });
  });

  await service.selectProvider("openai");

  const resolved = await service.resolveCredential();
  assert.deepEqual(
    {
      method: resolved?.method,
      providerId: resolved?.providerId,
      source: resolved?.source,
      sourceLabel: resolved?.sourceLabel,
    },
    {
      method: "api_key",
      providerId: "openai",
      source: "environment",
      sourceLabel: "Environment variable OPENAI_API_KEY",
    },
  );
});

void test("adds oauth support for providers exposed by the provider registry", () => {
  const service = new ProviderAuthService();
  const providers = service.listProviders();
  const anthropic = providers.find((provider) => provider.id === "anthropic");

  assert.ok(anthropic);
  assert.ok(anthropic.authMethods.includes("oauth"));
});

void test("refreshes expired oauth credentials and syncs the auth bridge", async (context) => {
  const storePath = await createStorePath("capyfin-auth");
  const providerId = "capyfin-test-oauth";
  registerOAuthProvider({
    getApiKey(credentials) {
      return credentials.access;
    },
    id: providerId,
    login() {
      return Promise.reject(new Error("Not used in this test."));
    },
    name: "CapyFin Test OAuth",
    refreshToken() {
      return Promise.resolve({
        access: "oauth-access-refreshed",
        expires: Date.now() + 60_000,
        refresh: "oauth-refresh-refreshed",
      });
    },
  });

  context.after(async () => {
    unregisterOAuthProvider(providerId);
    await rm(dirname(storePath), { force: true, recursive: true });
  });

  const service = new ProviderAuthService({ storePath });

  await service.saveOAuthProfile({
    credentials: {
      access: "oauth-access-initial",
      expires: Date.now() - 1_000,
      refresh: "oauth-refresh-initial",
    },
    providerId,
  });

  const resolved = await service.resolveCredential(providerId);
  assert.deepEqual(
    {
      method: resolved?.method,
      providerId: resolved?.providerId,
      secret: resolved?.secret,
      source: resolved?.source,
    },
    {
      method: "oauth",
      providerId,
      secret: "oauth-access-refreshed",
      source: "profile",
    },
  );

  const authBridge = await loadAuthBridge(storePath);
  assert.ok(authBridge[providerId]);
  const bridgeCredential = authBridge[providerId];
  if (bridgeCredential.type !== "oauth") {
    throw new Error("Expected oauth bridge credential.");
  }
  assert.equal(bridgeCredential.access, "oauth-access-refreshed");
  assert.equal(bridgeCredential.refresh, "oauth-refresh-refreshed");
  assert.ok(Number.isFinite(bridgeCredential.expires));
});
