import assert from "node:assert/strict";
import test from "node:test";
import {
  FALLBACK_AGENT_DESCRIPTION,
  formatAgentCount,
  formatModelId,
  formatProviderId,
  getAgentDisplayName,
  getConnectionDisplayName,
  getModelDisplayName,
  getProviderDisplayName,
  isDevDescription,
} from "./copy.ts";
import type { ProviderDefinition, ProviderModelCatalog } from "@capyfin/contracts";

void test("formatAgentCount returns zero-state message when count is 0", () => {
  assert.equal(formatAgentCount(0), "No custom agents yet.");
});

void test("formatAgentCount uses singular 'agent' when count is 1", () => {
  assert.equal(formatAgentCount(1), "1 agent available");
});

void test("formatAgentCount uses plural 'agents' when count is 2", () => {
  assert.equal(formatAgentCount(2), "2 agents available");
});

void test("formatAgentCount uses plural 'agents' for larger counts", () => {
  assert.equal(formatAgentCount(10), "10 agents available");
});

// --- isDevDescription tests ---

void test("isDevDescription returns true for undefined description", () => {
  assert.equal(isDevDescription(undefined), true);
});

void test("isDevDescription returns true for description containing 'orchestration'", () => {
  assert.equal(isDevDescription("Primary CapyFin finance orchestration agent."), true);
});

void test("isDevDescription returns true for description containing 'workspace agent'", () => {
  assert.equal(isDevDescription("Default workspace agent for finance tasks"), true);
});

void test("isDevDescription returns true for description containing 'default agent'", () => {
  assert.equal(isDevDescription("This is the default agent"), true);
});

void test("isDevDescription is case-insensitive", () => {
  assert.equal(isDevDescription("ORCHESTRATION engine"), true);
  assert.equal(isDevDescription("Workspace Agent setup"), true);
});

void test("isDevDescription returns false for custom user-written description", () => {
  assert.equal(isDevDescription("My personal stock screener bot"), false);
});

void test("isDevDescription returns false for the fallback description itself", () => {
  assert.equal(isDevDescription(FALLBACK_AGENT_DESCRIPTION), false);
});

// --- getAgentDisplayName tests ---

void test("getAgentDisplayName replaces 'Main' with 'CapyFin'", () => {
  assert.equal(getAgentDisplayName("Main"), "CapyFin");
});

void test("getAgentDisplayName passes through custom agent names", () => {
  assert.equal(getAgentDisplayName("Technical Analyst"), "Technical Analyst");
  assert.equal(getAgentDisplayName("My Bot"), "My Bot");
});

void test("getAgentDisplayName handles other dev-facing names", () => {
  assert.equal(getAgentDisplayName("default"), "CapyFin");
  assert.equal(getAgentDisplayName("assistant"), "CapyFin");
});

void test("getAgentDisplayName is case-sensitive for custom names", () => {
  // "main" lowercase is unlikely to be a user-chosen name, but we only override exact known dev names
  assert.equal(getAgentDisplayName("Custom Agent"), "Custom Agent");
});

void test("FALLBACK_AGENT_DESCRIPTION does not contain developer jargon", () => {
  const jargonTerms = ["orchestration", "orchestrator", "primary", "default workspace"];
  for (const term of jargonTerms) {
    assert.ok(
      !FALLBACK_AGENT_DESCRIPTION.toLowerCase().includes(term),
      `Fallback description should not contain developer jargon "${term}"`,
    );
  }
});

void test("FALLBACK_AGENT_DESCRIPTION describes user value", () => {
  assert.ok(
    FALLBACK_AGENT_DESCRIPTION.length > 20,
    "Fallback description should be a meaningful sentence",
  );
});

// --- getProviderDisplayName tests ---

const MOCK_PROVIDERS: ProviderDefinition[] = [
  {
    id: "copilot",
    name: "Copilot",
    methods: [
      {
        id: "github-oauth",
        input: "oauth",
        label: "Sign in with GitHub",
        providerId: "github-copilot",
      },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    methods: [
      {
        id: "anthropic-token",
        input: "token",
        label: "Anthropic token (paste setup-token)",
        providerId: "anthropic-api",
      },
    ],
  },
];

void test("getProviderDisplayName returns parent provider name for matching providerId", () => {
  assert.equal(
    getProviderDisplayName("github-copilot", MOCK_PROVIDERS),
    "Copilot",
  );
});

void test("getProviderDisplayName resolves Anthropic provider correctly", () => {
  assert.equal(
    getProviderDisplayName("anthropic-api", MOCK_PROVIDERS),
    "Anthropic",
  );
});

void test("getProviderDisplayName falls back to providerName when no match found", () => {
  assert.equal(
    getProviderDisplayName("unknown-provider", MOCK_PROVIDERS, "Some Fallback"),
    "Some Fallback",
  );
});

void test("getProviderDisplayName formats providerId when no match and no fallback", () => {
  assert.equal(
    getProviderDisplayName("unknown-provider", MOCK_PROVIDERS),
    "Unknown Provider",
  );
});

void test("getProviderDisplayName formats raw ID for empty providers array", () => {
  assert.equal(
    getProviderDisplayName("github-copilot", []),
    "Github Copilot",
  );
});

void test("getProviderDisplayName handles undefined providers", () => {
  assert.equal(
    getProviderDisplayName("github-copilot", undefined, "Fallback Name"),
    "Fallback Name",
  );
});

void test("getProviderDisplayName formats raw ID when providers undefined and no fallback", () => {
  assert.equal(
    getProviderDisplayName("github-copilot", undefined),
    "Github Copilot",
  );
});

// --- formatProviderId tests ---

void test("formatProviderId converts hyphenated ID to title case", () => {
  assert.equal(formatProviderId("github-copilot"), "Github Copilot");
});

void test("formatProviderId capitalizes single-word ID", () => {
  assert.equal(formatProviderId("anthropic"), "Anthropic");
});

void test("formatProviderId handles multi-segment ID", () => {
  assert.equal(formatProviderId("anthropic-api-key"), "Anthropic Api Key");
});

void test("formatProviderId preserves already-capitalized words", () => {
  assert.equal(formatProviderId("openai"), "Openai");
});

void test("formatProviderId handles underscore separators", () => {
  assert.equal(formatProviderId("open_ai"), "Open Ai");
});

// --- getConnectionDisplayName tests ---

void test("getConnectionDisplayName returns 'GitHub' for 'github'", () => {
  assert.equal(getConnectionDisplayName("github"), "GitHub");
});

void test("getConnectionDisplayName capitalizes single-word label", () => {
  assert.equal(getConnectionDisplayName("anthropic"), "Anthropic");
});

void test("getConnectionDisplayName formats hyphenated label", () => {
  assert.equal(getConnectionDisplayName("my-connection"), "My Connection");
});

void test("getConnectionDisplayName preserves already-capitalized label", () => {
  assert.equal(getConnectionDisplayName("GitHub"), "GitHub");
});

void test("getConnectionDisplayName handles 'openai' brand name", () => {
  assert.equal(getConnectionDisplayName("openai"), "OpenAI");
});

// --- formatModelId tests ---

void test("formatModelId formats 'gpt-4-mini' to 'GPT-4 Mini'", () => {
  assert.equal(formatModelId("gpt-4-mini"), "GPT-4 Mini");
});

void test("formatModelId formats 'gpt-5' to 'GPT-5'", () => {
  assert.equal(formatModelId("gpt-5"), "GPT-5");
});

void test("formatModelId formats 'claude-opus-4-6' to 'Claude Opus 4.6'", () => {
  assert.equal(formatModelId("claude-opus-4-6"), "Claude Opus 4.6");
});

void test("formatModelId formats 'claude-sonnet-4-5' to 'Claude Sonnet 4.5'", () => {
  assert.equal(formatModelId("claude-sonnet-4-5"), "Claude Sonnet 4.5");
});

void test("formatModelId formats 'o3-mini' to 'O3 Mini'", () => {
  assert.equal(formatModelId("o3-mini"), "O3 Mini");
});

void test("formatModelId title-cases unknown model IDs", () => {
  assert.equal(formatModelId("some-custom-model"), "Some Custom Model");
});

void test("formatModelId handles single-word model ID", () => {
  assert.equal(formatModelId("gemini"), "Gemini");
});

void test("formatModelId handles underscore separators", () => {
  assert.equal(formatModelId("gpt_4_mini"), "GPT-4 Mini");
});

// --- getModelDisplayName tests ---

const MOCK_MODEL_CATALOG: ProviderModelCatalog = {
  providerId: "github-copilot",
  models: [
    {
      modelId: "gpt-4-mini",
      modelRef: "github-copilot/gpt-4-mini",
      label: "GPT-4 Mini",
      providerId: "github-copilot",
      isSelected: true,
    },
    {
      modelId: "gpt-5",
      modelRef: "github-copilot/gpt-5",
      label: "GPT-5",
      providerId: "github-copilot",
      isSelected: false,
    },
  ],
};

void test("getModelDisplayName returns catalog label when model is found", () => {
  assert.equal(
    getModelDisplayName("gpt-4-mini", MOCK_MODEL_CATALOG),
    "GPT-4 Mini",
  );
});

void test("getModelDisplayName falls back to formatting when model not in catalog", () => {
  assert.equal(
    getModelDisplayName("claude-opus-4-6", MOCK_MODEL_CATALOG),
    "Claude Opus 4.6",
  );
});

void test("getModelDisplayName falls back to formatting when catalog is undefined", () => {
  assert.equal(
    getModelDisplayName("gpt-4-mini", undefined),
    "GPT-4 Mini",
  );
});

void test("getModelDisplayName uses catalog over formatting for matching model", () => {
  const catalogWithCustomLabel: ProviderModelCatalog = {
    providerId: "test",
    models: [
      {
        modelId: "my-model",
        modelRef: "test/my-model",
        label: "My Special Model",
        providerId: "test",
        isSelected: true,
      },
    ],
  };
  assert.equal(
    getModelDisplayName("my-model", catalogWithCustomLabel),
    "My Special Model",
  );
});
