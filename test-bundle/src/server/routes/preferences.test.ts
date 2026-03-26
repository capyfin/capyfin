import assert from "node:assert/strict";
import test from "node:test";
import { createPreferencesRoutes } from "./preferences.ts";
import type { UserPreferences } from "@capyfin/contracts";

function createMockRuntime() {
  let stored: UserPreferences = {
    investmentStyle: null,
    timeHorizon: null,
    riskTolerance: null,
    favoriteSectors: [],
    preferredMarketFocus: null,
    reportDensity: null,
    developerMode: false,
    traceVisibility: false,
  };

  return {
    preferencesService: {
      get() {
        return Promise.resolve({ ...stored });
      },
      update(partial: Partial<UserPreferences>) {
        stored = { ...stored, ...partial };
        return this.get();
      },
    },
    authSessions: {} as never,
    authService: {} as never,
    config: {} as never,
    dataProviderService: {} as never,
    embeddedGateway: {} as never,
    gatewaySupervisor: {} as never,
    startedAt: Date.now(),
    version: "0.1.0-test",
  };
}

void test("GET / returns default preferences", async () => {
  const runtime = createMockRuntime();
  const app = createPreferencesRoutes(runtime as never);

  const response = await app.request("/");
  assert.equal(response.status, 200);

  const body = (await response.json()) as UserPreferences;
  assert.equal(body.investmentStyle, null);
  assert.equal(body.developerMode, false);
});

void test("PUT / updates preferences", async () => {
  const runtime = createMockRuntime();
  const app = createPreferencesRoutes(runtime as never);

  const response = await app.request("/", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ investmentStyle: "growth", developerMode: true }),
  });
  assert.equal(response.status, 200);

  const body = (await response.json()) as UserPreferences;
  assert.equal(body.investmentStyle, "growth");
  assert.equal(body.developerMode, true);
});

void test("PUT / with empty body returns preferences", async () => {
  const runtime = createMockRuntime();
  const app = createPreferencesRoutes(runtime as never);

  const response = await app.request("/", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert.equal(response.status, 200);

  const body = (await response.json()) as UserPreferences;
  assert.equal(body.investmentStyle, null);
});
