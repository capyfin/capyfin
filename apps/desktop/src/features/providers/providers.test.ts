import assert from "node:assert/strict";
import test from "node:test";
import {
  dataProviderOverviewSchema,
  dataProviderStatusSchema,
  saveDataProviderKeyRequestSchema,
} from "@capyfin/contracts";

// ---------------------------------------------------------------------------
// Data provider Zod schemas
// ---------------------------------------------------------------------------

void test("dataProviderStatusSchema validates a connected provider", () => {
  const result = dataProviderStatusSchema.parse({
    id: "fmp",
    name: "FMP",
    description: "Structured financials, screener, earnings data",
    tier: "Free — 250 calls/day",
    signupUrl: "https://site.financialmodelingprep.com/developer/docs",
    connected: true,
    connectedAt: "2026-03-21T10:00:00.000Z",
  });
  assert.equal(result.id, "fmp");
  assert.equal(result.connected, true);
  assert.equal(result.connectedAt, "2026-03-21T10:00:00.000Z");
});

void test("dataProviderStatusSchema validates a disconnected provider", () => {
  const result = dataProviderStatusSchema.parse({
    id: "fred",
    name: "FRED",
    description: "Macro indicators, interest rates, inflation, GDP",
    tier: "Free",
    signupUrl: "https://fred.stlouisfed.org/docs/api/api_key.html",
    connected: false,
  });
  assert.equal(result.id, "fred");
  assert.equal(result.connected, false);
  assert.equal(result.connectedAt, undefined);
});

void test("dataProviderOverviewSchema validates a provider list", () => {
  const result = dataProviderOverviewSchema.parse({
    providers: [
      {
        id: "fmp",
        name: "FMP",
        description: "Structured financials",
        tier: "Free — 250 calls/day",
        signupUrl: "https://example.com",
        connected: false,
      },
      {
        id: "fred",
        name: "FRED",
        description: "Macro indicators",
        tier: "Free",
        signupUrl: "https://example.com",
        connected: true,
        connectedAt: "2026-03-21T10:00:00.000Z",
      },
    ],
  });
  assert.equal(result.providers.length, 2);
  assert.equal(result.providers[0]?.connected, false);
  assert.equal(result.providers[1]?.connected, true);
});

void test("saveDataProviderKeyRequestSchema validates an API key payload", () => {
  const result = saveDataProviderKeyRequestSchema.parse({
    apiKey: "my-api-key-123",
  });
  assert.equal(result.apiKey, "my-api-key-123");
});

void test("saveDataProviderKeyRequestSchema rejects empty API key", () => {
  assert.throws(() => {
    saveDataProviderKeyRequestSchema.parse({ apiKey: "" });
  });
});

// ---------------------------------------------------------------------------
// Navigation config
// ---------------------------------------------------------------------------

void test("primaryNavigation includes Providers item with correct icon", async () => {
  const { primaryNavigation } = await import("@/app/config/navigation");
  const providersItem = primaryNavigation.find(
    (item) => item.title === "Providers",
  );
  assert.ok(providersItem, "Providers navigation item should exist");
  assert.equal(providersItem.href, "#providers");
});

void test("primaryNavigation no longer includes Connections item", async () => {
  const { primaryNavigation } = await import("@/app/config/navigation");
  const titles = primaryNavigation.map((item) => item.title);
  assert.ok(!titles.includes("Connections" as never));
});

// ---------------------------------------------------------------------------
// App state
// ---------------------------------------------------------------------------

void test("AppView type includes providers and providers-add", async () => {
  const { createInitialState, appReducer } = await import(
    "@/app/state/app-state"
  );
  const state = createInitialState(() => "providers");
  assert.equal(state.hashView, "providers");

  const next = appReducer(state, { type: "SET_HASH_VIEW", view: "providers-add" });
  assert.equal(next.hashView, "providers-add");
});
