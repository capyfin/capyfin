import assert from "node:assert/strict";
import test from "node:test";
import type { ProviderDefinition } from "@capyfin/contracts";
import { groupProviders } from "./provider-groups";

function makeProvider(id: string, name?: string): ProviderDefinition {
  return {
    id,
    name: name ?? id,
    methods: [{ id: `${id}-key`, providerId: id, label: "API Key", input: "api_key" as const }],
  };
}

void test("groups popular providers into the first section", () => {
  const providers = [
    makeProvider("openai", "OpenAI"),
    makeProvider("anthropic", "Anthropic"),
    makeProvider("google", "Google Gemini"),
    makeProvider("xai", "xAI"),
    makeProvider("mistral", "Mistral"),
    makeProvider("together", "Together AI"),
  ];
  const groups = groupProviders(providers, new Set());
  const popular = groups.find((g) => g.title === "Popular");
  assert.ok(popular, "Popular group should exist");
  const popularIds = popular.providers.map((p) => p.id);
  assert.ok(popularIds.includes("openai"));
  assert.ok(popularIds.includes("anthropic"));
  assert.ok(popularIds.includes("google"));
  assert.ok(popularIds.includes("xai"));
  assert.ok(popularIds.includes("mistral"));
  assert.ok(!popularIds.includes("together"));
});

void test("groups self-hosted providers into a separate section", () => {
  const providers = [
    makeProvider("openai", "OpenAI"),
    makeProvider("ollama", "Ollama"),
    makeProvider("vllm", "vLLM"),
    makeProvider("sglang", "SGLang"),
    makeProvider("custom", "Custom Provider"),
    makeProvider("litellm", "LiteLLM"),
  ];
  const groups = groupProviders(providers, new Set());
  const selfHosted = groups.find((g) => g.title === "Self-hosted");
  assert.ok(selfHosted, "Self-hosted group should exist");
  const selfHostedIds = selfHosted.providers.map((p) => p.id);
  assert.ok(selfHostedIds.includes("ollama"));
  assert.ok(selfHostedIds.includes("vllm"));
  assert.ok(selfHostedIds.includes("sglang"));
  assert.ok(selfHostedIds.includes("custom"));
  assert.ok(selfHostedIds.includes("litellm"));
});

void test("remaining providers go into More providers section", () => {
  const providers = [
    makeProvider("openai", "OpenAI"),
    makeProvider("openrouter", "OpenRouter"),
    makeProvider("together", "Together AI"),
    makeProvider("huggingface", "Hugging Face"),
  ];
  const groups = groupProviders(providers, new Set());
  const more = groups.find((g) => g.title === "More providers");
  assert.ok(more, "More providers group should exist");
  const moreIds = more.providers.map((p) => p.id);
  assert.ok(moreIds.includes("openrouter"));
  assert.ok(moreIds.includes("together"));
  assert.ok(moreIds.includes("huggingface"));
});

void test("connected providers sort to the top of their group", () => {
  const providers = [
    makeProvider("openai", "OpenAI"),
    makeProvider("anthropic", "Anthropic"),
    makeProvider("google", "Google Gemini"),
    makeProvider("mistral", "Mistral"),
  ];
  const connected = new Set(["anthropic"]);
  const groups = groupProviders(providers, connected);
  const popular = groups.find((g) => g.title === "Popular");
  assert.ok(popular, "Popular group should exist");
  const firstProvider = popular.providers[0];
  assert.ok(firstProvider, "Popular group should have providers");
  assert.equal(firstProvider.id, "anthropic");
});

void test("omits empty groups", () => {
  const providers = [
    makeProvider("openai", "OpenAI"),
    makeProvider("anthropic", "Anthropic"),
  ];
  const groups = groupProviders(providers, new Set());
  const titles = groups.map((g) => g.title);
  assert.ok(!titles.includes("Self-hosted"));
  assert.ok(!titles.includes("More providers"));
});

void test("returns correct group order: Popular, More providers, Self-hosted", () => {
  const providers = [
    makeProvider("openai", "OpenAI"),
    makeProvider("together", "Together AI"),
    makeProvider("ollama", "Ollama"),
  ];
  const groups = groupProviders(providers, new Set());
  const titles = groups.map((g) => g.title);
  assert.deepEqual(titles, ["Popular", "More providers", "Self-hosted"]);
});

void test("handles empty provider list", () => {
  const groups = groupProviders([], new Set());
  assert.equal(groups.length, 0);
});

void test("ProviderGroup has expected shape", () => {
  const providers = [makeProvider("openai", "OpenAI")];
  const groups = groupProviders(providers, new Set());
  assert.equal(groups.length, 1);
  const group = groups.find((g) => g.title === "Popular");
  assert.ok(group, "Popular group should exist");
  assert.equal(typeof group.title, "string");
  assert.ok(Array.isArray(group.providers));
});

void test("Popular group has isPopular flag set to true", () => {
  const providers = [
    makeProvider("openai", "OpenAI"),
    makeProvider("together", "Together AI"),
    makeProvider("ollama", "Ollama"),
  ];
  const groups = groupProviders(providers, new Set());
  const popular = groups.find((g) => g.title === "Popular");
  assert.ok(popular, "Popular group should exist");
  assert.equal(popular.isPopular, true);
});

void test("Non-popular groups have isPopular flag set to false", () => {
  const providers = [
    makeProvider("openai", "OpenAI"),
    makeProvider("together", "Together AI"),
    makeProvider("ollama", "Ollama"),
  ];
  const groups = groupProviders(providers, new Set());
  const more = groups.find((g) => g.title === "More providers");
  assert.ok(more, "More providers group should exist");
  assert.equal(more.isPopular, false);
  const selfHosted = groups.find((g) => g.title === "Self-hosted");
  assert.ok(selfHosted, "Self-hosted group should exist");
  assert.equal(selfHosted.isPopular, false);
});
