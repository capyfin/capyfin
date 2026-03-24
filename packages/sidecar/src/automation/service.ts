import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import {
  automationSchema,
  automationRunSchema,
  type Automation,
  type AutomationRun,
  type CreateAutomationRequest,
  type UpdateAutomationRequest,
} from "@capyfin/contracts";

interface AutomationStore {
  version: 1;
  automations: Automation[];
}

interface AutomationRunStore {
  version: 1;
  runs: AutomationRun[];
}

export class AutomationService {
  readonly #automationsPath: string;
  readonly #runsPath: string;

  constructor(stateDir: string) {
    this.#automationsPath = join(stateDir, "automations.json");
    this.#runsPath = join(stateDir, "automation-runs.json");
  }

  async list(): Promise<Automation[]> {
    const store = await this.#loadAutomations();
    return store.automations;
  }

  async get(id: string): Promise<Automation> {
    const store = await this.#loadAutomations();
    const automation = store.automations.find((a) => a.id === id);
    if (!automation) {
      throw new Error(`Automation not found: ${id}`);
    }
    return automation;
  }

  async create(request: CreateAutomationRequest): Promise<Automation> {
    const store = await this.#loadAutomations();
    const now = new Date().toISOString();
    const automation = automationSchema.parse({
      id: randomUUID(),
      cardId: request.cardId,
      cardTitle: request.cardTitle,
      schedule: request.schedule,
      destination: request.destination,
      filters: request.filters ?? null,
      enabled: request.enabled,
      createdAt: now,
      updatedAt: now,
      lastRunAt: null,
      lastRunStatus: null,
    });
    store.automations.push(automation);
    await this.#saveAutomations(store);
    return automation;
  }

  async update(
    id: string,
    partial: UpdateAutomationRequest,
  ): Promise<Automation> {
    const store = await this.#loadAutomations();
    const index = store.automations.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new Error(`Automation not found: ${id}`);
    }
    const existing = store.automations.at(index);
    if (!existing) {
      throw new Error(`Automation not found: ${id}`);
    }
    const updated = automationSchema.parse({
      ...existing,
      ...(partial.cardTitle !== undefined
        ? { cardTitle: partial.cardTitle }
        : {}),
      ...(partial.schedule !== undefined ? { schedule: partial.schedule } : {}),
      ...(partial.destination !== undefined
        ? { destination: partial.destination }
        : {}),
      ...(partial.filters !== undefined ? { filters: partial.filters } : {}),
      ...(partial.enabled !== undefined ? { enabled: partial.enabled } : {}),
      updatedAt: new Date().toISOString(),
    });
    store.automations[index] = updated;
    await this.#saveAutomations(store);
    return updated;
  }

  async delete(id: string): Promise<{ deleted: true }> {
    const store = await this.#loadAutomations();
    const index = store.automations.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new Error(`Automation not found: ${id}`);
    }
    store.automations.splice(index, 1);
    await this.#saveAutomations(store);

    // Also remove associated runs
    const runStore = await this.#loadRuns();
    runStore.runs = runStore.runs.filter((r) => r.automationId !== id);
    await this.#saveRuns(runStore);

    return { deleted: true };
  }

  async listRuns(automationId: string): Promise<AutomationRun[]> {
    const store = await this.#loadRuns();
    return store.runs.filter((r) => r.automationId === automationId);
  }

  async addRun(
    automationId: string,
    input: Omit<AutomationRun, "id" | "automationId">,
  ): Promise<AutomationRun> {
    // Verify automation exists
    await this.get(automationId);

    const runStore = await this.#loadRuns();
    const run = automationRunSchema.parse({
      id: randomUUID(),
      automationId,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      status: input.status,
      duration: input.duration,
      outputReportId: input.outputReportId,
    });
    runStore.runs.push(run);
    await this.#saveRuns(runStore);
    return run;
  }

  async #loadAutomations(): Promise<AutomationStore> {
    try {
      const raw = await readFile(this.#automationsPath, "utf-8");
      return JSON.parse(raw) as AutomationStore;
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        "code" in error &&
        (error as NodeJS.ErrnoException).code === "ENOENT"
      ) {
        return { version: 1, automations: [] };
      }
      throw error;
    }
  }

  async #saveAutomations(store: AutomationStore): Promise<void> {
    const directory = dirname(this.#automationsPath);
    await mkdir(directory, { recursive: true });
    const temporaryPath = join(
      directory,
      `.tmp-${String(process.pid)}-${String(Date.now())}-${randomUUID()}.json`,
    );
    await writeFile(temporaryPath, JSON.stringify(store, null, 2), "utf-8");
    await rename(temporaryPath, this.#automationsPath);
  }

  async #loadRuns(): Promise<AutomationRunStore> {
    try {
      const raw = await readFile(this.#runsPath, "utf-8");
      return JSON.parse(raw) as AutomationRunStore;
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        "code" in error &&
        (error as NodeJS.ErrnoException).code === "ENOENT"
      ) {
        return { version: 1, runs: [] };
      }
      throw error;
    }
  }

  async #saveRuns(store: AutomationRunStore): Promise<void> {
    const directory = dirname(this.#runsPath);
    await mkdir(directory, { recursive: true });
    const temporaryPath = join(
      directory,
      `.tmp-${String(process.pid)}-${String(Date.now())}-${randomUUID()}.json`,
    );
    await writeFile(temporaryPath, JSON.stringify(store, null, 2), "utf-8");
    await rename(temporaryPath, this.#runsPath);
  }
}
