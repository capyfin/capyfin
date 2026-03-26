import assert from "node:assert/strict";
import test from "node:test";
import { SETTINGS_TABS } from "./components/SettingsWorkspace";

void test("SETTINGS_TABS contains all 6 settings sections", () => {
  assert.equal(SETTINGS_TABS.length, 6);
  const ids = SETTINGS_TABS.map((t) => t.id);
  assert.ok(ids.includes("ai-models"));
  assert.ok(ids.includes("financial-data"));
  assert.ok(ids.includes("delivery-channels"));
  assert.ok(ids.includes("appearance"));
  assert.ok(ids.includes("preferences"));
  assert.ok(ids.includes("advanced"));
});

void test("SettingsWorkspace exports a function component", async () => {
  const mod = await import("./components/SettingsWorkspace");
  assert.equal(typeof mod.SettingsWorkspace, "function");
});

void test("SettingsWorkspace exports SETTINGS_TABS config", async () => {
  const mod = await import("./components/SettingsWorkspace");
  assert.ok("SettingsWorkspace" in mod);
  assert.ok("SETTINGS_TABS" in mod);
});

// ---------------------------------------------------------------------------
// Tab components exports
// ---------------------------------------------------------------------------

void test("AIModelsTab exports a function component", async () => {
  const mod = await import("./components/AIModelsTab");
  assert.equal(typeof mod.AIModelsTab, "function");
});

void test("FinancialDataTab exports a function component", async () => {
  const mod = await import("./components/FinancialDataTab");
  assert.equal(typeof mod.FinancialDataTab, "function");
});

void test("DeliveryChannelsTab exports a function component", async () => {
  const mod = await import("./components/DeliveryChannelsTab");
  assert.equal(typeof mod.DeliveryChannelsTab, "function");
});

void test("AppearanceTab exports a function component", async () => {
  const mod = await import("./components/AppearanceTab");
  assert.equal(typeof mod.AppearanceTab, "function");
});

void test("PreferencesTab exports a function component", async () => {
  const mod = await import("./components/PreferencesTab");
  assert.equal(typeof mod.PreferencesTab, "function");
});

void test("AdvancedTab exports a function component", async () => {
  const mod = await import("./components/AdvancedTab");
  assert.equal(typeof mod.AdvancedTab, "function");
});

// ---------------------------------------------------------------------------
// App state — preferences integration
// ---------------------------------------------------------------------------

void test("AppState includes preferences field", async () => {
  const { createInitialState } = await import("@/app/state/app-state");
  const state = createInitialState(() => "settings");
  assert.equal(state.preferences, null);
  assert.equal(state.hashView, "settings");
});

void test("SET_PREFERENCES action updates preferences in state", async () => {
  const { createInitialState, appReducer } =
    await import("@/app/state/app-state");
  const state = createInitialState(() => "settings");
  const preferences = {
    investmentStyle: "growth" as const,
    timeHorizon: "long" as const,
    riskTolerance: "aggressive" as const,
    favoriteSectors: ["Technology"],
    preferredMarketFocus: "us" as const,
    reportDensity: "detailed" as const,
    developerMode: false,
    traceVisibility: false,
  };
  const next = appReducer(state, { type: "SET_PREFERENCES", preferences });
  assert.deepEqual(next.preferences, preferences);
});

void test("HYDRATE_SUCCESS includes preferences in state", async () => {
  const { createInitialState, appReducer } =
    await import("@/app/state/app-state");
  const state = createInitialState(() => "launchpad");
  const preferences = {
    investmentStyle: null,
    timeHorizon: null,
    riskTolerance: null,
    favoriteSectors: [] as string[],
    preferredMarketFocus: null,
    reportDensity: null,
    developerMode: false,
    traceVisibility: false,
  };
  const next = appReducer(state, {
    type: "HYDRATE_SUCCESS",
    authOverview: {
      providers: [],
      connections: [],
      selectedProviderId: "openai",
    } as never,
    client: {} as never,
    sessions: [],
    hasPortfolio: false,
    preferences,
  });
  assert.deepEqual(next.preferences, preferences);
});

// ---------------------------------------------------------------------------
// SidecarClient — preferences methods
// ---------------------------------------------------------------------------

void test("SidecarClient has getPreferences method", async () => {
  const { SidecarClient } = await import("@/lib/sidecar/client");
  assert.equal(typeof SidecarClient.prototype.getPreferences, "function");
});

void test("SidecarClient has updatePreferences method", async () => {
  const { SidecarClient } = await import("@/lib/sidecar/client");
  assert.equal(typeof SidecarClient.prototype.updatePreferences, "function");
});
