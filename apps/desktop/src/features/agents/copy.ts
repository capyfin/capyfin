/**
 * Formats the agent count subtitle with correct singular/plural grammar.
 */
export function formatAgentCount(count: number): string {
  if (count === 0) {
    return "No custom agents yet.";
  }

  return `${String(count)} ${count === 1 ? "agent" : "agents"} available`;
}

/**
 * User-facing fallback description shown when an agent has no custom description.
 */
export const FALLBACK_AGENT_DESCRIPTION =
  "Your financial research assistant — analyzes markets, reads SEC filings, and tracks your watchlist.";

const DEV_AGENT_NAMES = new Set(["Main", "default", "assistant"]);

/**
 * Returns a user-friendly display name for the agent.
 * Replaces internal/dev-facing names with "CapyFin".
 */
export function getAgentDisplayName(name: string): string {
  return DEV_AGENT_NAMES.has(name) ? "CapyFin" : name;
}

import type { ProviderDefinition, ProviderModelCatalog } from "@capyfin/contracts";

/**
 * Converts a raw provider ID like "github-copilot" into a readable label
 * like "GitHub Copilot" by splitting on hyphens/underscores and capitalising
 * each word.
 */
export function formatProviderId(providerId: string): string {
  return providerId
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Resolves a user-friendly provider display name from the parent provider definition.
 * Matches the connection's `providerId` against each provider's `methods[].providerId`
 * and returns the parent provider's `name` field.
 * Falls back to `fallback`, then to a formatted version of the raw `providerId`.
 */
export function getProviderDisplayName(
  providerId: string,
  providers: ProviderDefinition[] | undefined,
  fallback?: string,
): string {
  if (!providers) {
    return fallback ?? formatProviderId(providerId);
  }

  const parent = providers.find((provider) =>
    provider.methods.some((method) => method.providerId === providerId),
  );

  return parent?.name ?? fallback ?? formatProviderId(providerId);
}

/**
 * Well-known connection label → brand-correct display name mappings.
 */
const CONNECTION_DISPLAY_NAMES: Record<string, string> = {
  github: "GitHub",
  openai: "OpenAI",
};

/**
 * Returns a user-friendly display name for a connection label.
 * Looks up known brand names first, then falls back to title-casing.
 * If the label is already capitalised (first char uppercase), returns it as-is.
 */
export function getConnectionDisplayName(label: string): string {
  const known = CONNECTION_DISPLAY_NAMES[label.toLowerCase()];
  if (known) return known;

  // Already capitalised — return as-is
  if (/^[A-Z]/.test(label)) {
    return label;
  }

  return formatProviderId(label);
}

/**
 * Well-known model ID segments that should be uppercased.
 */
const MODEL_BRAND_UPPER: Record<string, string> = {
  gpt: "GPT",
};

/**
 * Brands where a following version number should be hyphen-joined (e.g. GPT-4).
 */
const HYPHEN_VERSION_BRANDS = new Set(["GPT"]);

/**
 * Formats a raw model ID (e.g. "gpt-4-mini") into a user-friendly label
 * (e.g. "GPT-4 Mini"). Handles well-known brand acronyms, version numbers,
 * and falls back to title-casing.
 */
export function formatModelId(modelId: string): string {
  const segments = modelId.split(/[-_]/);
  const result: string[] = [];
  let prevWasNumeric = false;

  for (const seg of segments) {
    const isNumeric = /^\d+$/.test(seg);
    const known = MODEL_BRAND_UPPER[seg.toLowerCase()];
    const formatted =
      known ??
      (isNumeric ? seg : seg.charAt(0).toUpperCase() + seg.slice(1));

    const last = result[result.length - 1];

    if (result.length === 0) {
      result.push(formatted);
    } else if (isNumeric && prevWasNumeric && last !== undefined) {
      // Consecutive numbers → version separator: "4", "6" → "4.6"
      result[result.length - 1] = last + "." + seg;
    } else if (
      isNumeric &&
      last !== undefined &&
      HYPHEN_VERSION_BRANDS.has(last)
    ) {
      // Number after known brand → hyphen join: "GPT", "4" → "GPT-4"
      result[result.length - 1] = last + "-" + seg;
    } else {
      result.push(formatted);
    }

    prevWasNumeric = isNumeric;
  }

  return result.join(" ");
}

/**
 * Returns a user-friendly display name for a model ID.
 * Looks up the model in the catalog first, then falls back to formatting.
 */
export function getModelDisplayName(
  modelId: string,
  catalog: ProviderModelCatalog | undefined,
): string {
  if (catalog) {
    const model = catalog.models.find((m) => m.modelId === modelId);
    if (model) return model.label;
  }

  return formatModelId(modelId);
}

const DEV_PATTERNS = [/orchestration/i, /workspace agent/i, /default agent/i];

/**
 * Returns true when the description looks like developer-facing jargon
 * that should be replaced with the user-facing fallback.
 */
export function isDevDescription(desc: string | undefined): boolean {
  if (!desc) return true;
  return DEV_PATTERNS.some((p) => p.test(desc));
}
