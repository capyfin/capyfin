import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { WatchlistService } from "./service.ts";

async function createTempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), "watchlist-integration-"));
}

void test("WatchlistService writes watchlist.csv after add when workspaceDir is set", async () => {
  const stateDir = await createTempDir();
  const workspaceDir = await createTempDir();
  try {
    const service = new WatchlistService(stateDir, workspaceDir);
    await service.add({ ticker: "AAPL", list: "watching", note: "test note" });

    const csv = await readFile(join(workspaceDir, "watchlist.csv"), "utf-8");
    assert.ok(csv.includes("ticker,list,note,thesis,targetZone,addedAt,tags"));
    assert.ok(csv.includes("AAPL,watching,test note,"));
  } finally {
    await rm(stateDir, { recursive: true });
    await rm(workspaceDir, { recursive: true });
  }
});

void test("WatchlistService writes watchlist.csv after update", async () => {
  const stateDir = await createTempDir();
  const workspaceDir = await createTempDir();
  try {
    const service = new WatchlistService(stateDir, workspaceDir);
    await service.add({ ticker: "MSFT", list: "watching" });
    await service.update("MSFT", { list: "position", note: "Upgraded" });

    const csv = await readFile(join(workspaceDir, "watchlist.csv"), "utf-8");
    assert.ok(csv.includes("MSFT,position,Upgraded,"));
  } finally {
    await rm(stateDir, { recursive: true });
    await rm(workspaceDir, { recursive: true });
  }
});

void test("WatchlistService removes item from watchlist.csv after delete", async () => {
  const stateDir = await createTempDir();
  const workspaceDir = await createTempDir();
  try {
    const service = new WatchlistService(stateDir, workspaceDir);
    await service.add({ ticker: "AAPL", list: "watching" });
    await service.add({ ticker: "MSFT", list: "position" });
    await service.remove("AAPL");

    const csv = await readFile(join(workspaceDir, "watchlist.csv"), "utf-8");
    assert.ok(!csv.includes("AAPL"), "AAPL should be removed from CSV");
    assert.ok(csv.includes("MSFT"), "MSFT should still be in CSV");
  } finally {
    await rm(stateDir, { recursive: true });
    await rm(workspaceDir, { recursive: true });
  }
});

void test("WatchlistService does not write CSV when workspaceDir is not set", async () => {
  const stateDir = await createTempDir();
  try {
    const service = new WatchlistService(stateDir);
    await service.add({ ticker: "AAPL", list: "watching" });

    // No workspace dir means no CSV file, verify service still works
    const items = await service.getAll();
    assert.equal(items.length, 1);
    assert.equal(items[0]?.ticker, "AAPL");
  } finally {
    await rm(stateDir, { recursive: true });
  }
});

void test("WatchlistService appends Watchlist section to USER.md", async () => {
  const stateDir = await createTempDir();
  const workspaceDir = await createTempDir();
  try {
    const service = new WatchlistService(stateDir, workspaceDir);
    await service.add({ ticker: "AAPL", list: "watching" });

    const userMd = await readFile(join(workspaceDir, "USER.md"), "utf-8");
    assert.ok(userMd.includes("## Watchlist"));
    assert.ok(userMd.includes("watchlist.csv"));
  } finally {
    await rm(stateDir, { recursive: true });
    await rm(workspaceDir, { recursive: true });
  }
});
