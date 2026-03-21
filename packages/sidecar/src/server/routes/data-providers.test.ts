/* eslint-disable @typescript-eslint/no-dynamic-delete */
import assert from "node:assert/strict";
import test from "node:test";
import { createDataProviderRoutes } from "./data-providers.ts";

function createMockRuntime() {
  const stored: Record<string, { apiKey: string; connectedAt: string }> = {};

  return {
    dataProviderService: {
      getAll() {
        return Promise.resolve({
          providers: [
            {
              id: "fmp",
              name: "FMP",
              description: "Structured financials, screener, earnings data",
              tier: "Free — 250 calls/day",
              signupUrl: "https://site.financialmodelingprep.com/developer/docs",
              connected: Boolean(stored.fmp),
              connectedAt: stored.fmp?.connectedAt,
            },
            {
              id: "fred",
              name: "FRED",
              description: "Macro indicators, interest rates, inflation, GDP",
              tier: "Free",
              signupUrl: "https://fred.stlouisfed.org/docs/api/api_key.html",
              connected: Boolean(stored.fred),
              connectedAt: stored.fred?.connectedAt,
            },
          ],
        });
      },
      saveKey(providerId: string, apiKey: string) {
        const connectedAt = new Date().toISOString();
        stored[providerId] = { apiKey, connectedAt };
        const defs: Record<string, { name: string; description: string; tier: string; signupUrl: string }> = {
          fmp: { name: "FMP", description: "Structured financials, screener, earnings data", tier: "Free — 250 calls/day", signupUrl: "https://site.financialmodelingprep.com/developer/docs" },
          fred: { name: "FRED", description: "Macro indicators, interest rates, inflation, GDP", tier: "Free", signupUrl: "https://fred.stlouisfed.org/docs/api/api_key.html" },
        };
        const def = defs[providerId];
        if (!def) throw new Error(`Unknown data provider: "${providerId}".`);
        return Promise.resolve({ id: providerId, ...def, connected: true, connectedAt });
      },
      deleteKey(providerId: string) {
        delete stored[providerId];
        return Promise.resolve();
      },
    },
    authSessions: {} as never,
    authService: {} as never,
    config: {} as never,
    embeddedGateway: {} as never,
    gatewaySupervisor: {} as never,
    startedAt: Date.now(),
    version: "0.1.0-test",
  };
}

void test("GET /data returns all providers", async () => {
  const runtime = createMockRuntime();
  const app = createDataProviderRoutes(runtime as never);

  const response = await app.request("/data");
  assert.equal(response.status, 200);

  const body = (await response.json()) as { providers: { id: string; connected: boolean }[] };
  assert.equal(body.providers.length, 2);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const fmp = body.providers[0]!;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const fred = body.providers[1]!;
  assert.equal(fmp.id, "fmp");
  assert.equal(fmp.connected, false);
  assert.equal(fred.id, "fred");
});

void test("PUT /data/:providerId saves an API key", async () => {
  const runtime = createMockRuntime();
  const app = createDataProviderRoutes(runtime as never);

  const response = await app.request("/data/fmp", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: "test-key-123" }),
  });
  assert.equal(response.status, 200);

  const body = (await response.json()) as { id: string; connected: boolean };
  assert.equal(body.id, "fmp");
  assert.equal(body.connected, true);
});

void test("DELETE /data/:providerId removes a key", async () => {
  const runtime = createMockRuntime();
  const app = createDataProviderRoutes(runtime as never);

  await app.request("/data/fred", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: "fred-key" }),
  });

  const response = await app.request("/data/fred", {
    method: "DELETE",
  });
  assert.equal(response.status, 204);
});
