import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import type {
  DataProviderOverview,
  DataProviderStatus,
} from "@capyfin/contracts";
import {
  DATA_PROVIDER_REGISTRY,
  getDataProviderDefinition,
} from "./registry.ts";

interface DataProviderStore {
  version: 1;
  providers: Record<string, { apiKey: string; connectedAt: string }>;
}

export class DataProviderService {
  readonly #storePath: string;

  constructor(stateDir: string) {
    this.#storePath = join(stateDir, "data-providers.json");
  }

  async getAll(): Promise<DataProviderOverview> {
    const store = await this.#load();
    const providers: DataProviderStatus[] = DATA_PROVIDER_REGISTRY.map(
      (definition) => {
        const stored = store.providers[definition.id];
        return {
          ...definition,
          connected: Boolean(stored),
          connectedAt: stored?.connectedAt,
        };
      },
    );
    return { providers };
  }

  async saveKey(
    providerId: string,
    apiKey: string,
  ): Promise<DataProviderStatus> {
    const definition = getDataProviderDefinition(providerId);
    if (!definition) {
      throw new Error(`Unknown data provider: "${providerId}".`);
    }

    const store = await this.#load();
    const connectedAt = new Date().toISOString();
    store.providers[providerId] = { apiKey, connectedAt };
    await this.#save(store);

    return {
      ...definition,
      connected: true,
      connectedAt,
    };
  }

  async deleteKey(providerId: string): Promise<void> {
    const store = await this.#load();
    const { [providerId]: _removed, ...remaining } = store.providers;
    void _removed;
    store.providers = remaining;
    await this.#save(store);
  }

  async #load(): Promise<DataProviderStore> {
    try {
      const raw = await readFile(this.#storePath, "utf-8");
      return JSON.parse(raw) as DataProviderStore;
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        "code" in error &&
        (error as NodeJS.ErrnoException).code === "ENOENT"
      ) {
        return { version: 1, providers: {} };
      }
      throw error;
    }
  }

  async #save(store: DataProviderStore): Promise<void> {
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
