import assert from "node:assert/strict";
import test from "node:test";
import { createOpenAICodexOAuthProvider } from "./openai-codex-provider.ts";

void test("openai codex oauth provider emits the auth handoff and returns credentials", async () => {
  const events: string[] = [];
  const provider = createOpenAICodexOAuthProvider({
    createAuthorizationFlow() {
      return Promise.resolve({
        state: "state-123",
        url: "https://example.com/oauth",
        verifier: "verifier-123",
      });
    },
    exchangeAuthorizationCode(code, verifier) {
      assert.equal(code, "auth-code-123");
      assert.equal(verifier, "verifier-123");
      return Promise.resolve({
        access: "oauth-access",
        expires: Date.now() + 60_000,
        refresh: "oauth-refresh",
        type: "success",
      });
    },
    getAccountId() {
      return "account-123";
    },
    refreshAccessToken() {
      return Promise.resolve({
        access: "oauth-access-refreshed",
        expires: Date.now() + 60_000,
        refresh: "oauth-refresh-refreshed",
        type: "success",
      });
    },
    startCallbackServer() {
      return Promise.resolve({
        cancelWait() {
          return undefined;
        },
        close() {
          return undefined;
        },
        waitForCode() {
          return Promise.resolve(null);
        },
      });
    },
  });

  const credentials = await provider.login({
    onAuth(info) {
      events.push(`auth:${info.url}`);
    },
    onPrompt() {
      return Promise.resolve("auth-code-123");
    },
  });

  assert.deepEqual(events, ["auth:https://example.com/oauth"]);
  assert.equal(credentials.access, "oauth-access");
  assert.equal(credentials.refresh, "oauth-refresh");
  assert.equal(credentials.accountId, "account-123");
  assert.ok(Number.isFinite(credentials.expires));
});
