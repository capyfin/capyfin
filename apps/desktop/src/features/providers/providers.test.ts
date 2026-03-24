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
// Data provider icon configuration
// ---------------------------------------------------------------------------

void test("dataProviderIconConfig returns icon config for fmp", async () => {
  const { dataProviderIconConfig } =
    await import("./components/data-provider-icons");
  const config = dataProviderIconConfig.fmp;
  assert.ok(config, "FMP icon config should exist");
  assert.ok(config.icon, "FMP should have an icon component");
  assert.ok(config.bg.includes("blue"), "FMP bg should be blue-tinted");
  assert.ok(config.text.includes("blue"), "FMP text should be blue");
});

void test("dataProviderIconConfig returns icon config for fred", async () => {
  const { dataProviderIconConfig } =
    await import("./components/data-provider-icons");
  const config = dataProviderIconConfig.fred;
  assert.ok(config, "FRED icon config should exist");
  assert.ok(config.icon, "FRED should have an icon component");
  assert.ok(config.bg.includes("violet"), "FRED bg should be violet-tinted");
  assert.ok(config.text.includes("violet"), "FRED text should be violet");
});

void test("dataProviderIconConfig entries have distinct colors", async () => {
  const { dataProviderIconConfig } =
    await import("./components/data-provider-icons");
  const fmp = dataProviderIconConfig.fmp;
  const fred = dataProviderIconConfig.fred;
  assert.ok(fmp && fred, "Both configs should exist");
  assert.notEqual(
    fmp.bg,
    fred.bg,
    "FMP and FRED should have different bg colors",
  );
  assert.notEqual(
    fmp.text,
    fred.text,
    "FMP and FRED should have different text colors",
  );
});

// ---------------------------------------------------------------------------
// Navigation config
// ---------------------------------------------------------------------------

void test("primaryNavigation includes Settings item (Providers accessible from Settings)", async () => {
  const { primaryNavigation } = await import("@/app/config/navigation");
  const settingsItem = primaryNavigation.find(
    (item) => item.title === "Settings",
  );
  assert.ok(settingsItem, "Settings navigation item should exist");
  assert.equal(settingsItem.href, "#settings");
});

void test("primaryNavigation no longer includes Providers or Connections as top-level items", async () => {
  const { primaryNavigation } = await import("@/app/config/navigation");
  const titles = primaryNavigation.map((item) => item.title);
  assert.ok(!titles.includes("Providers" as never));
  assert.ok(!titles.includes("Connections" as never));
});

// ---------------------------------------------------------------------------
// App state
// ---------------------------------------------------------------------------

void test("AppView type includes providers and providers-add", async () => {
  const { createInitialState, appReducer } =
    await import("@/app/state/app-state");
  const state = createInitialState(() => "providers");
  assert.equal(state.hashView, "providers");

  const next = appReducer(state, {
    type: "SET_HASH_VIEW",
    view: "providers-add",
  });
  assert.equal(next.hashView, "providers-add");
});
