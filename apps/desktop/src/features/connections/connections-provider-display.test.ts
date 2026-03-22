import assert from "node:assert/strict";
import test from "node:test";
import { getProviderDisplayName } from "@/features/agents/copy.ts";
import type { ProviderDefinition } from "@capyfin/contracts";

const MOCK_PROVIDERS: ProviderDefinition[] = [
  {
    id: "copilot",
    name: "GitHub Copilot",
    methods: [
      {
        id: "github-oauth",
        input: "oauth",
        label: "Sign in with GitHub",
        providerId: "github-copilot",
      },
    ],
  },
];

void test("ConnectionsWorkspace provider cell should resolve friendly name from providers list", () => {
  // Simulates ConnectionRow displaying provider name via getProviderDisplayName
  const result = getProviderDisplayName(
    "github-copilot",
    MOCK_PROVIDERS,
    "Sign in with GitHub",
  );
  assert.equal(result, "GitHub Copilot");
});

void test("ConnectionsWorkspace provider cell should format raw ID when provider list has no match", () => {
  const result = getProviderDisplayName(
    "github-copilot",
    [],
    "github-copilot",
  );
  // Falls back to the fallback param, which is the raw providerName
  assert.equal(result, "github-copilot");
});

void test("ConnectionsWorkspace provider cell should use formatProviderId as ultimate fallback", () => {
  // When providers list is available but has no match and no fallback,
  // formatProviderId transforms the raw ID
  const result = getProviderDisplayName("github-copilot", []);
  assert.equal(result, "Github Copilot");
});

void test("ConnectionsWorkspace provider cell should prefer parent provider name over raw connection.providerName", () => {
  // connection.providerName might be the auth method label "Sign in with GitHub"
  // but getProviderDisplayName should resolve to the parent provider name "GitHub Copilot"
  const result = getProviderDisplayName(
    "github-copilot",
    MOCK_PROVIDERS,
    "Sign in with GitHub",
  );
  assert.notEqual(result, "Sign in with GitHub");
  assert.equal(result, "GitHub Copilot");
});
