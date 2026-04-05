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

// ---------------------------------------------------------------------------
// Tab-specific descriptions
// ---------------------------------------------------------------------------

void test("Every settings tab has a unique description", () => {
  for (const tab of SETTINGS_TABS) {
    assert.ok(
      typeof tab.description === "string" && tab.description.length > 0,
      `Tab "${tab.id}" must have a non-empty description`,
    );
  }
  const descriptions = SETTINGS_TABS.map((t) => t.description);
  const unique = new Set(descriptions);
  assert.equal(
    unique.size,
    SETTINGS_TABS.length,
    "Descriptions must be unique",
  );
});

void test("Tab descriptions are concise (under 80 characters)", () => {
  for (const tab of SETTINGS_TABS) {
    assert.ok(
      tab.description.length <= 80,
      `Tab "${tab.id}" description is ${String(tab.description.length)} chars, must be ≤80`,
    );
  }
});

void test("No tab description is the generic 'Manage your settings'", () => {
  for (const tab of SETTINGS_TABS) {
    assert.notEqual(
      tab.description.toLowerCase(),
      "manage your settings",
      `Tab "${tab.id}" must not use generic subtitle`,
    );
  }
});

void test("Appearance tab description does not mention density or display", () => {
  const appearance = SETTINGS_TABS.find((t) => t.id === "appearance");
  assert.ok(appearance, "Appearance tab must exist");
  const desc = appearance.description.toLowerCase();
  assert.ok(
    !desc.includes("density"),
    `Appearance description must not mention "density" — got: "${appearance.description}"`,
  );
  assert.ok(
    !desc.includes("display"),
    `Appearance description must not mention "display" — got: "${appearance.description}"`,
  );
});

void test("Appearance tab description mentions theme", () => {
  const appearance = SETTINGS_TABS.find((t) => t.id === "appearance");
  assert.ok(appearance, "Appearance tab must exist");
  assert.ok(
    appearance.description.toLowerCase().includes("theme"),
    `Appearance description should mention "theme" — got: "${appearance.description}"`,
  );
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
