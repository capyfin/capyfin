import assert from "node:assert/strict";
import test from "node:test";
import { createGlobalRoutes } from "./global.ts";
import type { WatchlistItem } from "@capyfin/contracts";

function createMockRuntime(watchlistItems: WatchlistItem[] = []) {
  return {
    watchlistService: {
      getAll() {
        return Promise.resolve([...watchlistItems]);
      },
    },
    version: "0.1.0-test",
    startedAt: Date.now(),
    config: {} as never,
    authSessions: {} as never,
    authService: {} as never,
    dataProviderService: {} as never,
    embeddedGateway: {} as never,
    gatewaySupervisor: {} as never,
    libraryService: {} as never,
    portfolioService: {} as never,
    preferencesService: {} as never,
  };
}

void test("GET /bootstrap includes watchlist count of 0 when empty", async () => {
  const runtime = createMockRuntime();
  const app = createGlobalRoutes(runtime as never);

  const response = await app.request("/bootstrap");
  assert.equal(response.status, 200);

  const body = (await response.json()) as { watchlist?: { count: number } };
  assert.ok(body.watchlist !== undefined, "bootstrap should include watchlist");
  assert.equal(body.watchlist.count, 0);
});

void test("GET /bootstrap includes correct watchlist count", async () => {
  const items: WatchlistItem[] = [
    { ticker: "AAPL", list: "watching", addedAt: "2025-01-01T00:00:00Z" },
    { ticker: "MSFT", list: "position", addedAt: "2025-01-02T00:00:00Z" },
    { ticker: "GOOGL", list: "watching", addedAt: "2025-01-03T00:00:00Z" },
  ];
  const runtime = createMockRuntime(items);
  const app = createGlobalRoutes(runtime as never);

  const response = await app.request("/bootstrap");
  assert.equal(response.status, 200);

  const body = (await response.json()) as { watchlist?: { count: number } };
  assert.ok(body.watchlist !== undefined);
  assert.equal(body.watchlist.count, 3);
});
