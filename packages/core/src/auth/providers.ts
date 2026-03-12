import { getOAuthProviders } from "@mariozechner/pi-ai/oauth";
import type { ProviderDefinition } from "./types";

const BUILTIN_PROVIDER_DEFINITIONS = [
  {
    id: "anthropic",
    name: "Anthropic",
    authMethods: ["api_key"],
    envVars: ["ANTHROPIC_OAUTH_TOKEN", "ANTHROPIC_API_KEY"],
    secretType: "api_key",
    description: "Claude APIs via API key, with OAuth available where supported.",
  },
  {
    id: "openai",
    name: "OpenAI",
    authMethods: ["api_key"],
    envVars: ["OPENAI_API_KEY"],
    secretType: "api_key",
  },
  {
    id: "google",
    name: "Google",
    authMethods: ["api_key"],
    envVars: ["GEMINI_API_KEY"],
    secretType: "api_key",
  },
  {
    id: "google-vertex",
    name: "Google Vertex AI",
    authMethods: ["api_key", "application_default"],
    envVars: [
      "GOOGLE_CLOUD_API_KEY",
      "GOOGLE_APPLICATION_CREDENTIALS",
      "GOOGLE_CLOUD_PROJECT",
      "GCLOUD_PROJECT",
      "GOOGLE_CLOUD_LOCATION",
    ],
    secretType: "api_key",
  },
  {
    id: "mistral",
    name: "Mistral",
    authMethods: ["api_key"],
    envVars: ["MISTRAL_API_KEY"],
    secretType: "api_key",
  },
  {
    id: "groq",
    name: "Groq",
    authMethods: ["api_key"],
    envVars: ["GROQ_API_KEY"],
    secretType: "api_key",
  },
  {
    id: "xai",
    name: "xAI",
    authMethods: ["api_key"],
    envVars: ["XAI_API_KEY"],
    secretType: "api_key",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    authMethods: ["api_key"],
    envVars: ["OPENROUTER_API_KEY"],
    secretType: "api_key",
  },
  {
    id: "cerebras",
    name: "Cerebras",
    authMethods: ["api_key"],
    envVars: ["CEREBRAS_API_KEY"],
    secretType: "api_key",
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    authMethods: ["token"],
    envVars: ["HF_TOKEN"],
    secretType: "token",
  },
  {
    id: "github-copilot",
    name: "GitHub Copilot",
    authMethods: ["token"],
    envVars: ["COPILOT_GITHUB_TOKEN", "GH_TOKEN", "GITHUB_TOKEN"],
    secretType: "token",
  },
  {
    id: "amazon-bedrock",
    name: "Amazon Bedrock",
    authMethods: ["aws_sdk"],
    envVars: [
      "AWS_BEARER_TOKEN_BEDROCK",
      "AWS_ACCESS_KEY_ID",
      "AWS_SECRET_ACCESS_KEY",
      "AWS_PROFILE",
      "AWS_CONTAINER_CREDENTIALS_RELATIVE_URI",
      "AWS_CONTAINER_CREDENTIALS_FULL_URI",
      "AWS_WEB_IDENTITY_TOKEN_FILE",
    ],
  },
  {
    id: "azure-openai-responses",
    name: "Azure OpenAI",
    authMethods: ["api_key"],
    envVars: ["AZURE_OPENAI_API_KEY"],
    secretType: "api_key",
  },
  {
    id: "vercel-ai-gateway",
    name: "Vercel AI Gateway",
    authMethods: ["api_key"],
    envVars: ["AI_GATEWAY_API_KEY"],
    secretType: "api_key",
  },
  {
    id: "zai",
    name: "Z.ai",
    authMethods: ["api_key"],
    envVars: ["ZAI_API_KEY"],
    secretType: "api_key",
  },
] satisfies ProviderDefinition[];

function humanizeProviderId(providerId: string): string {
  return providerId
    .split("-")
    .map((segment) =>
      segment.length > 0
        ? `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`
        : segment,
    )
    .join(" ");
}

export function listProviderDefinitions(): ProviderDefinition[] {
  const providerMap = new Map<string, ProviderDefinition>(
    BUILTIN_PROVIDER_DEFINITIONS.map((provider) => [provider.id, provider]),
  );

  for (const provider of getOAuthProviders()) {
    const existing = providerMap.get(provider.id);

    if (existing) {
      providerMap.set(provider.id, {
        ...existing,
        authMethods: Array.from(
          new Set<ProviderDefinition["authMethods"][number]>([
            ...existing.authMethods,
            "oauth",
          ]),
        ),
        oauthProviderId: provider.id,
        name: existing.name || provider.name,
      });
      continue;
    }

    providerMap.set(provider.id, {
      id: provider.id,
      name: provider.name || humanizeProviderId(provider.id),
      authMethods: ["oauth"],
      envVars: [],
      oauthProviderId: provider.id,
      description: "OAuth-backed provider integration.",
    });
  }

  return [...providerMap.values()].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

export function getProviderDefinition(
  providerId: string,
): ProviderDefinition | undefined {
  return listProviderDefinitions().find((provider) => provider.id === providerId);
}
