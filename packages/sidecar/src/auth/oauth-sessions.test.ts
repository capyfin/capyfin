import test from "node:test";
import assert from "node:assert/strict";
import type { OAuthLoginCallbacks } from "@mariozechner/pi-ai/oauth";
import type { ProviderAuthService } from "@capyfin/core/auth";
import { OAuthSessionManager } from "./oauth-sessions.ts";

void test("oauth sessions expose link and prompt steps before completion", async () => {
  const manager = new OAuthSessionManager(
    () =>
      ({
        listProviders() {
          return [
            {
              authMethods: ["oauth"],
              envVars: [],
              id: "anthropic",
              name: "Anthropic",
            },
          ];
        },
        async loginWithOAuth({
          callbacks,
        }: {
          callbacks: OAuthLoginCallbacks;
        }) {
          callbacks.onAuth({
            instructions: "Approve the login in your browser.",
            url: "https://example.com/login",
          });
          const code = await callbacks.onManualCodeInput?.();
          callbacks.onProgress?.(`Received ${code ?? "unknown"} code`);

          return {
            createdAt: new Date(0).toISOString(),
            isActiveProfile: true,
            label: "default",
            profileId: "anthropic:default",
            providerId: "anthropic",
            type: "oauth",
            updatedAt: new Date(0).toISOString(),
          };
        },
      }) as unknown as ProviderAuthService,
  );

  const session = manager.start({ providerId: "anthropic" });

  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

  const promptSession = manager.get(session.id);
  assert.ok(promptSession);
  assert.equal(promptSession.step.type, "prompt");
  assert.equal(promptSession.authUrl, "https://example.com/login");
  assert.equal(
    promptSession.authInstructions,
    "Approve the login in your browser.",
  );

  manager.respond(session.id, "123456");

  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

  const completedSession = manager.get(session.id);
  assert.ok(completedSession);
  assert.equal(completedSession.state, "completed");
  assert.equal(completedSession.authUrl, "https://example.com/login");
  assert.equal(completedSession.profile?.profileId, "anthropic:default");
});
