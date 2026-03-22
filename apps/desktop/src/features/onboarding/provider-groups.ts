import type { ProviderDefinition } from "@/app/types";

export interface ProviderGroup {
  title: string;
  isPopular: boolean;
  providers: ProviderDefinition[];
}

const POPULAR_IDS = new Set([
  "openai",
  "anthropic",
  "google",
  "xai",
  "mistral",
]);
const SELF_HOSTED_IDS = new Set([
  "ollama",
  "vllm",
  "sglang",
  "custom",
  "litellm",
]);

/**
 * Groups providers into "Popular", "More providers", and "Self-hosted" sections.
 * Connected providers are sorted to the top of their respective group.
 */
export function groupProviders(
  providers: ProviderDefinition[],
  connectedIds: Set<string>,
): ProviderGroup[] {
  const popular: ProviderDefinition[] = [];
  const more: ProviderDefinition[] = [];
  const selfHosted: ProviderDefinition[] = [];

  for (const provider of providers) {
    if (POPULAR_IDS.has(provider.id)) {
      popular.push(provider);
    } else if (SELF_HOSTED_IDS.has(provider.id)) {
      selfHosted.push(provider);
    } else {
      more.push(provider);
    }
  }

  const sortConnectedFirst = (list: ProviderDefinition[]) =>
    list.sort((a, b) => {
      const aConnected = connectedIds.has(a.methods[0]?.providerId ?? a.id);
      const bConnected = connectedIds.has(b.methods[0]?.providerId ?? b.id);
      if (aConnected && !bConnected) return -1;
      if (!aConnected && bConnected) return 1;
      return 0;
    });

  const groups: ProviderGroup[] = [];
  if (popular.length > 0)
    groups.push({
      title: "Popular",
      isPopular: true,
      providers: sortConnectedFirst(popular),
    });
  if (more.length > 0)
    groups.push({
      title: "More providers",
      isPopular: false,
      providers: sortConnectedFirst(more),
    });
  if (selfHosted.length > 0)
    groups.push({
      title: "Self-hosted",
      isPopular: false,
      providers: sortConnectedFirst(selfHosted),
    });

  return groups;
}
