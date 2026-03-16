import assert from "node:assert/strict";
import test from "node:test";
import { buildProviderModelCatalog } from "./service.ts";

void test("buildProviderModelCatalog drops stale invalid selected models", () => {
  const catalog = buildProviderModelCatalog({
    catalog: [
      {
        id: "gpt-4o",
        name: "GPT-4o",
        provider: "github-copilot",
      },
      {
        id: "claude-sonnet-4.5",
        name: "Claude Haiku 4.5",
        provider: "github-copilot",
      },
      {
        id: "gpt-5.4",
        name: "GPT-5.4",
        provider: "openai-codex",
      },
    ],
    currentModelRef: "github-copilot/gpt-5.4",
    providerId: "github-copilot",
  });

  assert.equal(catalog.currentModelId, undefined);
  assert.equal(catalog.currentModelRef, undefined);
  assert.deepEqual(
    catalog.models.map((entry) => entry.modelRef),
    ["github-copilot/gpt-4o", "github-copilot/claude-sonnet-4.5"],
  );
  assert.ok(catalog.models.every((entry) => !entry.isSelected));
});
