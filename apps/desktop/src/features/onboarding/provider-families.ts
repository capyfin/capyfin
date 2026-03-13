import type { AuthOverview, ProviderStatus } from "@/app/types";

export type ConnectionMode =
  | "api_key"
  | "oauth"
  | "token"
  | "application_default"
  | "aws_sdk";

export interface ProviderFamilyOption {
  description: string;
  isAvailable: boolean;
  isConnected: boolean;
  isSelected: boolean;
  key: string;
  label: string;
  mode: ConnectionMode;
  providerId: string;
  providerStatus?: ProviderStatus;
}

export interface ProviderFamily {
  description: string;
  id: string;
  isConnected: boolean;
  isSelected: boolean;
  options: ProviderFamilyOption[];
  title: string;
}

interface ProviderFamilySpec {
  description: string;
  id: string;
  options: {
    description: string;
    label: string;
    mode: ConnectionMode;
    providerId: string;
  }[];
  title: string;
}

const curatedFamilies: ProviderFamilySpec[] = [
  {
    id: "openai",
    title: "OpenAI",
    description: "GPT models through API keys or a ChatGPT subscription sign-in.",
    options: [
      {
        providerId: "openai",
        mode: "api_key",
        label: "Use API key",
        description: "Connect directly with an OpenAI API key.",
      },
      {
        providerId: "openai-codex",
        mode: "oauth",
        label: "Login with Codex",
        description: "Use your ChatGPT Plus or Pro subscription.",
      },
    ],
  },
  {
    id: "anthropic",
    title: "Anthropic",
    description: "Claude access with either an API key or Claude account sign-in.",
    options: [
      {
        providerId: "anthropic",
        mode: "api_key",
        label: "Use API key",
        description: "Connect with an Anthropic API key.",
      },
      {
        providerId: "anthropic",
        mode: "oauth",
        label: "Sign in with Claude",
        description: "Use your Claude Pro or Max subscription.",
      },
    ],
  },
  {
    id: "google",
    title: "Google",
    description: "Gemini, Vertex AI, and Google-hosted sign-in flows.",
    options: [
      {
        providerId: "google",
        mode: "api_key",
        label: "Use Gemini API key",
        description: "Connect with a Gemini API key.",
      },
      {
        providerId: "google-vertex",
        mode: "application_default",
        label: "Use Vertex credentials",
        description: "Use local Google Cloud application default credentials.",
      },
      {
        providerId: "google-gemini-cli",
        mode: "oauth",
        label: "Sign in with Gemini CLI",
        description: "Authenticate with your Google-hosted Gemini CLI account.",
      },
      {
        providerId: "google-antigravity",
        mode: "oauth",
        label: "Sign in with Antigravity",
        description: "Authenticate with your Antigravity account.",
      },
    ],
  },
  {
    id: "github-copilot",
    title: "GitHub Copilot",
    description: "Copilot access through a token or GitHub sign-in.",
    options: [
      {
        providerId: "github-copilot",
        mode: "token",
        label: "Use token",
        description: "Connect with a GitHub or Copilot access token.",
      },
      {
        providerId: "github-copilot",
        mode: "oauth",
        label: "Sign in with GitHub",
        description: "Authenticate with your GitHub Copilot account.",
      },
    ],
  },
  {
    id: "amazon-bedrock",
    title: "Amazon Bedrock",
    description: "Use AWS SDK credentials already available on this machine.",
    options: [
      {
        providerId: "amazon-bedrock",
        mode: "aws_sdk",
        label: "Use AWS credentials",
        description: "Connect with your local AWS SDK profile or environment.",
      },
    ],
  },
  {
    id: "azure-openai-responses",
    title: "Azure OpenAI",
    description: "Azure-hosted OpenAI models with a provisioned API key.",
    options: [
      {
        providerId: "azure-openai-responses",
        mode: "api_key",
        label: "Use API key",
        description: "Connect with an Azure OpenAI API key.",
      },
    ],
  },
  {
    id: "cerebras",
    title: "Cerebras",
    description: "High-throughput inference through a Cerebras API key.",
    options: [
      {
        providerId: "cerebras",
        mode: "api_key",
        label: "Use API key",
        description: "Connect with a Cerebras API key.",
      },
    ],
  },
  {
    id: "groq",
    title: "Groq",
    description: "Low-latency models through a Groq API key.",
    options: [
      {
        providerId: "groq",
        mode: "api_key",
        label: "Use API key",
        description: "Connect with a Groq API key.",
      },
    ],
  },
  {
    id: "huggingface",
    title: "Hugging Face",
    description: "Inference access through a Hugging Face token.",
    options: [
      {
        providerId: "huggingface",
        mode: "token",
        label: "Use token",
        description: "Connect with a Hugging Face access token.",
      },
    ],
  },
  {
    id: "mistral",
    title: "Mistral",
    description: "Mistral-hosted APIs with a static API key.",
    options: [
      {
        providerId: "mistral",
        mode: "api_key",
        label: "Use API key",
        description: "Connect with a Mistral API key.",
      },
    ],
  },
  {
    id: "openrouter",
    title: "OpenRouter",
    description: "Unified model routing through an OpenRouter API key.",
    options: [
      {
        providerId: "openrouter",
        mode: "api_key",
        label: "Use API key",
        description: "Connect with an OpenRouter API key.",
      },
    ],
  },
  {
    id: "vercel-ai-gateway",
    title: "Vercel AI Gateway",
    description: "Gateway-backed inference through a Vercel AI Gateway key.",
    options: [
      {
        providerId: "vercel-ai-gateway",
        mode: "api_key",
        label: "Use API key",
        description: "Connect with a Vercel AI Gateway API key.",
      },
    ],
  },
  {
    id: "xai",
    title: "xAI",
    description: "xAI models through a static API key.",
    options: [
      {
        providerId: "xai",
        mode: "api_key",
        label: "Use API key",
        description: "Connect with an xAI API key.",
      },
    ],
  },
  {
    id: "zai",
    title: "Z.ai",
    description: "Z.ai hosted inference through a static API key.",
    options: [
      {
        providerId: "zai",
        mode: "api_key",
        label: "Use API key",
        description: "Connect with a Z.ai API key.",
      },
    ],
  },
];

const curatedProviderIds = new Set(
  curatedFamilies.flatMap((family) => family.options.map((option) => option.providerId)),
);

export function buildProviderFamilies(
  authOverview: AuthOverview | null,
): ProviderFamily[] {
  const providerStatusById = new Map(
    (authOverview?.providers ?? []).map((provider) => [provider.provider.id, provider]),
  );
  const families = curatedFamilies
    .map((family) => createFamily(family, providerStatusById))
    .filter((family): family is ProviderFamily => family !== null);

  const uncategorizedProviders = (authOverview?.providers ?? [])
    .filter((provider) => !curatedProviderIds.has(provider.provider.id))
    .map((provider) => createFallbackFamily(provider));

  return [...families, ...uncategorizedProviders];
}

function createFamily(
  family: ProviderFamilySpec,
  providerStatusById: Map<string, ProviderStatus>,
): ProviderFamily | null {
  const options: ProviderFamilyOption[] = [];

  for (const option of family.options) {
    const providerStatus = providerStatusById.get(option.providerId);
    const isAvailable = providerStatus
      ? providerStatus.provider.authMethods.includes(option.mode)
      : true;

    if (!isAvailable) {
      continue;
    }

    options.push({
      ...option,
      key: `${option.providerId}:${option.mode}`,
      isAvailable,
      isConnected: providerStatus
        ? providerStatus.profiles.length > 0 || providerStatus.environment.available
        : false,
      isSelected: providerStatus?.isSelectedProvider ?? false,
      ...(providerStatus ? { providerStatus } : {}),
    });
  }

  if (options.length === 0) {
    return null;
  }

  return {
    id: family.id,
    title: family.title,
    description: family.description,
    options,
    isConnected: options.some((option) => option.isConnected),
    isSelected: options.some((option) => option.isSelected),
  };
}

function createFallbackFamily(provider: ProviderStatus): ProviderFamily {
  const options = provider.provider.authMethods.map((mode) => ({
    key: `${provider.provider.id}:${mode}`,
    providerId: provider.provider.id,
    mode,
    label: renderFallbackOptionLabel(mode),
    description: provider.provider.description ?? "Connect this provider.",
    isAvailable: true,
    isConnected: provider.profiles.length > 0 || provider.environment.available,
    isSelected: provider.isSelectedProvider,
    providerStatus: provider,
  }));

  return {
    id: provider.provider.id,
    title: provider.provider.name,
    description:
      provider.provider.description ?? "This provider is available for connection.",
    options,
    isConnected: options.some((option) => option.isConnected),
    isSelected: options.some((option) => option.isSelected),
  };
}

function renderFallbackOptionLabel(mode: ConnectionMode): string {
  switch (mode) {
    case "api_key":
      return "Use API key";
    case "application_default":
      return "Use app default credentials";
    case "aws_sdk":
      return "Use AWS credentials";
    case "oauth":
      return "Sign in";
    case "token":
      return "Use token";
  }
}
