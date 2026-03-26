import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import {
  savedReportSchema,
  type SavedReport,
  type SaveReportRequest,
  type UpdateReportRequest,
} from "@capyfin/contracts";

interface LibraryStore {
  version: 1;
  reports: SavedReport[];
}

export class LibraryService {
  readonly #storePath: string;

  constructor(stateDir: string) {
    this.#storePath = join(stateDir, "library.json");
  }

  async list(): Promise<SavedReport[]> {
    const store = await this.#load();
    return store.reports;
  }

  async get(id: string): Promise<SavedReport> {
    const store = await this.#load();
    const report = store.reports.find((r) => r.id === id);
    if (!report) {
      throw new Error(`Report not found: ${id}`);
    }
    return report;
  }

  async save(request: SaveReportRequest): Promise<SavedReport> {
    const store = await this.#load();
    const report = savedReportSchema.parse({
      id: randomUUID(),
      cardOutput: request.cardOutput,
      workflowType: request.workflowType,
      subject: request.subject,
      savedAt: new Date().toISOString(),
      pinnedAt: null,
      starred: false,
      tags: request.tags ?? [],
    });
    store.reports.push(report);
    await this.#save(store);
    return report;
  }

  async update(id: string, partial: UpdateReportRequest): Promise<SavedReport> {
    const store = await this.#load();
    const index = store.reports.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error(`Report not found: ${id}`);
    }
    // index is guaranteed valid — we just checked it's not -1
    const existing = store.reports.at(index);
    if (!existing) {
      throw new Error(`Report not found: ${id}`);
    }
    const updated = savedReportSchema.parse({
      ...existing,
      ...(partial.pinnedAt !== undefined ? { pinnedAt: partial.pinnedAt } : {}),
      ...(partial.starred !== undefined ? { starred: partial.starred } : {}),
      ...(partial.tags !== undefined ? { tags: partial.tags } : {}),
    });
    store.reports[index] = updated;
    await this.#save(store);
    return updated;
  }

  async delete(id: string): Promise<{ deleted: boolean }> {
    const store = await this.#load();
    const index = store.reports.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error(`Report not found: ${id}`);
    }
    store.reports.splice(index, 1);
    await this.#save(store);
    return { deleted: true };
  }

  async #load(): Promise<LibraryStore> {
    try {
      const raw = await readFile(this.#storePath, "utf-8");
      return JSON.parse(raw) as LibraryStore;
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        "code" in error &&
        (error as NodeJS.ErrnoException).code === "ENOENT"
      ) {
        return { version: 1, reports: [] };
      }
      throw error;
    }
  }

  async #save(store: LibraryStore): Promise<void> {
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
