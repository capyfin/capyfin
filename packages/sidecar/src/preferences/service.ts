import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  userPreferencesSchema,
  type UpdatePreferencesRequest,
  type UserPreferences,
} from "@capyfin/contracts";

interface PreferencesStore {
  version: 1;
  preferences: Record<string, unknown>;
}

export class PreferencesService {
  readonly #storePath: string;

  constructor(stateDir: string) {
    this.#storePath = join(stateDir, "preferences.json");
  }

  async get(): Promise<UserPreferences> {
    const store = await this.#load();
    return userPreferencesSchema.parse(store.preferences);
  }

  async update(partial: UpdatePreferencesRequest): Promise<UserPreferences> {
    const store = await this.#load();
    const current = userPreferencesSchema.parse(store.preferences);
    const merged: Record<string, unknown> = { ...current };
    for (const [key, value] of Object.entries(partial)) {
      if (value !== undefined) {
        merged[key] = value;
      }
    }
    const validated = userPreferencesSchema.parse(merged);
    store.preferences = validated;
    await this.#save(store);
    return validated;
  }

  async #load(): Promise<PreferencesStore> {
    try {
      const raw = await readFile(this.#storePath, "utf-8");
      return JSON.parse(raw) as PreferencesStore;
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        "code" in error &&
        (error as NodeJS.ErrnoException).code === "ENOENT"
      ) {
        return { version: 1, preferences: {} };
      }
      throw error;
    }
  }

  async #save(store: PreferencesStore): Promise<void> {
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
