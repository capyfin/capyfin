import assert from "node:assert/strict";
import test from "node:test";
import { createWatchlistRoutes } from "./watchlist.ts";
import type { WatchlistItem } from "@capyfin/contracts";

function createMockRuntime() {
  const items: WatchlistItem[] = [];

  return {
    watchlistService: {
      getAll() {
        return Promise.resolve([...items]);
      },
      add(input: { ticker: string; list: string; note?: string }) {
        const ticker = input.ticker.toUpperCase();
        if (items.some((i) => i.ticker === ticker)) {
          throw new Error(`Ticker already exists: ${ticker}`);
        }
        const item: WatchlistItem = {
          ticker,
          list: input.list as "position" | "watching",
          note: input.note,
          addedAt: new Date().toISOString(),
        };
        items.push(item);
        return Promise.resolve(item);
      },
      update(ticker: string, partial: Record<string, unknown>) {
        const normalized = ticker.toUpperCase();
        const index = items.findIndex((i) => i.ticker === normalized);
        if (index === -1) {
          throw new Error(`Ticker not found: ${normalized}`);
        }
        const existing = items.at(index);
        if (!existing) {
          throw new Error(`Ticker not found: ${normalized}`);
        }
        const updated = { ...existing, ...partial };
        items[index] = updated as WatchlistItem;
        return Promise.resolve(updated as WatchlistItem);
      },
      remove(ticker: string) {
        const normalized = ticker.toUpperCase();
        const index = items.findIndex((i) => i.ticker === normalized);
        if (index === -1) {
          throw new Error(`Ticker not found: ${normalized}`);
        }
        items.splice(index, 1);
        return Promise.resolve({ deleted: true as const });
      },
    },
    authSessions: {} as never,
    authService: {} as never,
    config: {} as never,
    dataProviderService: {} as never,
    embeddedGateway: {} as never,
    gatewaySupervisor: {} as never,
    libraryService: {} as never,
    portfolioService: {} as never,
    preferencesService: {} as never,
    startedAt: Date.now(),
    version: "0.1.0-test",
  };
}

void test("GET / returns empty list", async () => {
  const runtime = createMockRuntime();
  const app = createWatchlistRoutes(runtime as never);

  const response = await app.request("/");
  assert.equal(response.status, 200);

  const body = (await response.json()) as { items: WatchlistItem[] };
  assert.deepEqual(body.items, []);
});

void test("POST / creates item and returns 201", async () => {
  const runtime = createMockRuntime();
  const app = createWatchlistRoutes(runtime as never);

  const response = await app.request("/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker: "AAPL", list: "watching" }),
  });
  assert.equal(response.status, 201);

  const body = (await response.json()) as WatchlistItem;
  assert.equal(body.ticker, "AAPL");
  assert.equal(body.list, "watching");
  assert.ok(body.addedAt);
});

void test("POST / duplicate returns 409", async () => {
  const runtime = createMockRuntime();
  const app = createWatchlistRoutes(runtime as never);

  await app.request("/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker: "AAPL", list: "watching" }),
  });

  const response = await app.request("/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker: "AAPL", list: "position" }),
  });
  assert.equal(response.status, 409);
});

void test("PUT /:ticker updates existing item", async () => {
  const runtime = createMockRuntime();
  const app = createWatchlistRoutes(runtime as never);

  await app.request("/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker: "AAPL", list: "watching" }),
  });

  const response = await app.request("/AAPL", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ list: "position", note: "Upgraded" }),
  });
  assert.equal(response.status, 200);

  const body = (await response.json()) as WatchlistItem;
  assert.equal(body.list, "position");
  assert.equal(body.note, "Upgraded");
});

void test("PUT /:ticker non-existent returns 404", async () => {
  const runtime = createMockRuntime();
  const app = createWatchlistRoutes(runtime as never);

  const response = await app.request("/AAPL", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note: "test" }),
  });
  assert.equal(response.status, 404);
});

void test("DELETE /:ticker removes item", async () => {
  const runtime = createMockRuntime();
  const app = createWatchlistRoutes(runtime as never);

  await app.request("/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker: "AAPL", list: "watching" }),
  });

  const response = await app.request("/AAPL", { method: "DELETE" });
  assert.equal(response.status, 200);

  const body = (await response.json()) as { deleted: true };
  assert.deepEqual(body, { deleted: true });
});

void test("DELETE /:ticker non-existent returns 404", async () => {
  const runtime = createMockRuntime();
  const app = createWatchlistRoutes(runtime as never);

  const response = await app.request("/AAPL", { method: "DELETE" });
  assert.equal(response.status, 404);
});
