import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { WatchlistItem } from "@capyfin/contracts";
import { syncWatchlistToWorkspace } from "./workspace-sync.ts";

async function createTempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), "watchlist-sync-test-"));
}

const SAMPLE_ITEMS: WatchlistItem[] = [
  {
    ticker: "AAPL",
    list: "position",
    note: "Strong earnings",
    thesis: "AI growth",
    targetZone: "$180-$200",
    addedAt: "2025-01-15T10:00:00.000Z",
    tags: ["tech", "mega-cap"],
  },
  {
    ticker: "MSFT",
    list: "watching",
    addedAt: "2025-02-01T12:00:00.000Z",
  },
];

void test("syncWatchlistToWorkspace writes watchlist.csv with correct format", async () => {
  const dir = await createTempDir();
  try {
    await syncWatchlistToWorkspace(dir, SAMPLE_ITEMS);

    const csv = await readFile(join(dir, "watchlist.csv"), "utf-8");
    const lines = csv.trim().split("\n");

    assert.equal(lines[0], "ticker,list,note,thesis,targetZone,addedAt,tags");
    assert.equal(lines.length, 3); // header + 2 items
    assert.ok(lines[1]?.startsWith("AAPL,position,"));
    assert.ok(lines[2]?.startsWith("MSFT,watching,"));
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("syncWatchlistToWorkspace writes empty CSV with header when no items", async () => {
  const dir = await createTempDir();
  try {
    await syncWatchlistToWorkspace(dir, []);

    const csv = await readFile(join(dir, "watchlist.csv"), "utf-8");
    const lines = csv.trim().split("\n");

    assert.equal(lines[0], "ticker,list,note,thesis,targetZone,addedAt,tags");
    assert.equal(lines.length, 1); // header only
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("syncWatchlistToWorkspace appends Watchlist section to USER.md", async () => {
  const dir = await createTempDir();
  try {
    await syncWatchlistToWorkspace(dir, SAMPLE_ITEMS);

    const userMd = await readFile(join(dir, "USER.md"), "utf-8");
    assert.ok(userMd.includes("## Watchlist"));
    assert.ok(userMd.includes("watchlist.csv"));
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("syncWatchlistToWorkspace is idempotent on USER.md", async () => {
  const dir = await createTempDir();
  try {
    await syncWatchlistToWorkspace(dir, SAMPLE_ITEMS);
    await syncWatchlistToWorkspace(dir, SAMPLE_ITEMS);

    const userMd = await readFile(join(dir, "USER.md"), "utf-8");
    const occurrences = userMd.split("## Watchlist").length - 1;
    assert.equal(
      occurrences,
      1,
      "Watchlist section should appear exactly once",
    );
  } finally {
    await rm(dir, { recursive: true });
  }
});

void test("syncWatchlistToWorkspace preserves existing USER.md content", async () => {
  const dir = await createTempDir();
  try {
    const { writeFile: wf, mkdir: mkd } = await import("node:fs/promises");
    await mkd(dir, { recursive: true });
    await wf(
      join(dir, "USER.md"),
      "# Existing Content\n\nSome user data.\n",
      "utf-8",
    );

    await syncWatchlistToWorkspace(dir, SAMPLE_ITEMS);

    const userMd = await readFile(join(dir, "USER.md"), "utf-8");
    assert.ok(userMd.includes("# Existing Content"));
    assert.ok(userMd.includes("Some user data."));
    assert.ok(userMd.includes("## Watchlist"));
  } finally {
    await rm(dir, { recursive: true });
  }
});
