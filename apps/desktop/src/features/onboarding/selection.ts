import type { AuthOverview } from "@/app/types";
import type { ProviderFamily } from "./provider-families";

export function resolvePreferredOptionKey(
  family: ProviderFamily,
  authOverview: AuthOverview | null,
): string | null {
  const selectedProviderId = authOverview?.selectedProviderId;
  if (!selectedProviderId) {
    return null;
  }

  const matchingOptions = family.options.filter(
    (option) => option.providerId === selectedProviderId,
  );
  if (matchingOptions.length === 0) {
    return null;
  }

  const resolvedMethod = matchingOptions[0]?.providerStatus?.resolved?.method;
  if (resolvedMethod) {
    const methodMatch = matchingOptions.find(
      (option) => option.mode === resolvedMethod,
    );
    if (methodMatch) {
      return methodMatch.key;
    }
  }

  return matchingOptions.length === 1 ? matchingOptions[0]?.key ?? null : null;
}
