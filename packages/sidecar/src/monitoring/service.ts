import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import type { AttentionItem, AttentionItemList } from "@capyfin/contracts";
import type { CasesService } from "../cases/service.ts";
import { scanCases } from "./scanner.ts";

interface AttentionStore {
  version: 1;
  items: AttentionItem[];
  lastScanAt: string | null;
}

export class MonitoringService {
  readonly #storePath: string;
  readonly #casesService: CasesService;
  readonly #intervalMs: number;
  #intervalHandle: ReturnType<typeof setInterval> | null = null;

  constructor(
    stateDir: string,
    casesService: CasesService,
    intervalMs = 14_400_000, // 4 hours
  ) {
    this.#storePath = join(stateDir, "attention-items.json");
    this.#casesService = casesService;
    this.#intervalMs = intervalMs;
  }

  start(): void {
    // Run initial scan immediately
    void this.scan();
    this.#intervalHandle = setInterval(() => {
      void this.scan();
    }, this.#intervalMs);
  }

  stop(): void {
    if (this.#intervalHandle) {
      clearInterval(this.#intervalHandle);
      this.#intervalHandle = null;
    }
  }

  async scan(): Promise<void> {
    const cases = await this.#casesService.listCases();
    const store = await this.#load();
    const updatedItems = scanCases(cases, store.items);
    await this.#save({
      version: 1,
      items: updatedItems,
      lastScanAt: new Date().toISOString(),
    });
  }

  async getItems(filter?: {
    urgency?: string;
    attentionState?: string;
    includeDismissed?: boolean;
  }): Promise<AttentionItemList> {
    const store = await this.#load();
    let items = store.items;

    if (!filter?.includeDismissed) {
      items = items.filter((i) => !i.dismissed);
    }

    if (filter?.urgency) {
      items = items.filter((i) => i.urgency === filter.urgency);
    }

    if (filter?.attentionState) {
      items = items.filter((i) => i.attentionState === filter.attentionState);
    }

    return { items, lastScanAt: store.lastScanAt };
  }

  async dismissItem(itemId: string): Promise<AttentionItem> {
    const store = await this.#load();
    const item = store.items.find((i) => i.id === itemId);
    if (!item) {
      throw new Error(`Attention item not found: ${itemId}`);
    }
    item.dismissed = true;
    await this.#save(store);
    return item;
  }

  async #load(): Promise<AttentionStore> {
    try {
      const raw = await readFile(this.#storePath, "utf-8");
      return JSON.parse(raw) as AttentionStore;
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        "code" in error &&
        (error as NodeJS.ErrnoException).code === "ENOENT"
      ) {
        return { version: 1, items: [], lastScanAt: null };
      }
      throw error;
    }
  }

  async #save(store: AttentionStore): Promise<void> {
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
