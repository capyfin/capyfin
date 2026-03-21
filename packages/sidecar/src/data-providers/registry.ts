import type { DataProviderDefinition } from "@capyfin/contracts";

export const DATA_PROVIDER_REGISTRY: DataProviderDefinition[] = [
  {
    id: "fmp",
    name: "FMP",
    description: "Structured financials, screener, earnings data",
    tier: "Free — 250 calls/day",
    signupUrl: "https://site.financialmodelingprep.com/developer/docs",
  },
  {
    id: "fred",
    name: "FRED",
    description: "Macro indicators, interest rates, inflation, GDP",
    tier: "Free",
    signupUrl: "https://fred.stlouisfed.org/docs/api/api_key.html",
  },
];

export function getDataProviderDefinition(
  id: string,
): DataProviderDefinition | undefined {
  return DATA_PROVIDER_REGISTRY.find((provider) => provider.id === id);
}
