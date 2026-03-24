import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  watchlistItemSchema,
  type AddWatchlistItemRequest,
  type UpdateWatchlistItemRequest,
  type WatchlistItem,
} from "@capyfin/contracts";

interface WatchlistStore {
  version: 1;
  items: WatchlistItem[];
}

export class WatchlistService {
  readonly #storePath: string;

  constructor(stateDir: string) {
    this.#storePath = join(stateDir, "watchlist.json");
  }

  async getAll(): Promise<WatchlistItem[]> {
    const store = await this.#load();
    return store.items;
  }

  async add(input: AddWatchlistItemRequest): Promise<WatchlistItem> {
    const store = await this.#load();
    const ticker = input.ticker.toUpperCase();
    if (store.items.some((i) => i.ticker === ticker)) {
      throw new Error(`Ticker already exists: ${ticker}`);
    }
    const item = watchlistItemSchema.parse({
      ticker,
      list: input.list,
      note: input.note,
      thesis: input.thesis,
      targetZone: input.targetZone,
      addedAt: new Date().toISOString(),
      tags: input.tags,
    });
    store.items.push(item);
    await this.#save(store);
    return item;
  }

  async update(
    ticker: string,
    partial: UpdateWatchlistItemRequest,
  ): Promise<WatchlistItem> {
    const store = await this.#load();
    const normalizedTicker = ticker.toUpperCase();
    const index = store.items.findIndex((i) => i.ticker === normalizedTicker);
    if (index === -1) {
      throw new Error(`Ticker not found: ${normalizedTicker}`);
    }
    const existing = store.items.at(index);
    if (!existing) {
      throw new Error(`Ticker not found: ${normalizedTicker}`);
    }
    const updated = watchlistItemSchema.parse({
      ...existing,
      ...(partial.list !== undefined ? { list: partial.list } : {}),
      ...(partial.note !== undefined ? { note: partial.note } : {}),
      ...(partial.thesis !== undefined ? { thesis: partial.thesis } : {}),
      ...(partial.targetZone !== undefined
        ? { targetZone: partial.targetZone }
        : {}),
      ...(partial.tags !== undefined ? { tags: partial.tags } : {}),
    });
    store.items[index] = updated;
    await this.#save(store);
    return updated;
  }

  async remove(ticker: string): Promise<{ deleted: true }> {
    const store = await this.#load();
    const normalizedTicker = ticker.toUpperCase();
    const index = store.items.findIndex((i) => i.ticker === normalizedTicker);
    if (index === -1) {
      throw new Error(`Ticker not found: ${normalizedTicker}`);
    }
    store.items.splice(index, 1);
    await this.#save(store);
    return { deleted: true };
  }

  async #load(): Promise<WatchlistStore> {
    try {
      const raw = await readFile(this.#storePath, "utf-8");
      return JSON.parse(raw) as WatchlistStore;
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        "code" in error &&
        (error as NodeJS.ErrnoException).code === "ENOENT"
      ) {
        return { version: 1, items: [] };
      }
      throw error;
    }
  }

  async #save(store: WatchlistStore): Promise<void> {
    const directory = dirname(this.#storePath);
    await mkdir(directory, { recursive: true });
    const temporaryPath = join(
      directory,
      `.tmp-${String(process.pid)}-${String(Date.now())}-${randomUUID()}.json`,
    );
    await writeFile(temporaryPath, JSON.stringify(store, null, 2), "utf-8");
    await rename(temporaryPath, this.#storePath);
  }
}
