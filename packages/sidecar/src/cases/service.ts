import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  caseHistoryEntrySchema,
  investmentCaseSchema,
  type AddCaseHistoryEntryRequest,
  type CardOutput,
  type CaseFromOutputResponse,
  type CaseHistoryEntry,
  type CreateCaseRequest,
  type InvestmentCase,
  type UpdateCaseRequest,
} from "@capyfin/contracts";
import { computeAttentionState } from "./attention.ts";
import { buildChangeSummary } from "./history-summary.ts";
import {
  cardOutputToCreateRequest,
  cardOutputToUpdateFields,
} from "./output-mapper.ts";
import { mergeSections } from "./section-merge.ts";

interface CasesStore {
  version: 1;
  cases: InvestmentCase[];
}

export class CasesService {
  readonly #storePath: string;

  constructor(stateDir: string) {
    this.#storePath = join(stateDir, "cases.json");
  }

  #enrichCase(investmentCase: InvestmentCase): InvestmentCase {
    return {
      ...investmentCase,
      attentionState: computeAttentionState(investmentCase),
    };
  }

  async listCases(): Promise<InvestmentCase[]> {
    const store = await this.#load();
    return store.cases.map((c) => this.#enrichCase(c));
  }

  async getCase(id: string): Promise<InvestmentCase> {
    const store = await this.#load();
    const found = store.cases.find((c) => c.id === id);
    if (!found) {
      throw new Error(`Case not found: ${id}`);
    }
    return this.#enrichCase(found);
  }

  async createCase(request: CreateCaseRequest): Promise<InvestmentCase> {
    const store = await this.#load();
    const now = new Date().toISOString();
    const investmentCase = investmentCaseSchema.parse({
      id: randomUUID(),
      ticker: request.ticker,
      companyName: request.companyName,
      stance: request.stance ?? "watching",
      confidence: request.confidence ?? "MEDIUM",
      lastReviewedAt: now,
      createdAt: now,
      updatedAt: now,
      sections: request.sections ?? [],
      keyAssumptions: request.keyAssumptions ?? [],
      invalidationSignals: request.invalidationSignals ?? [],
      nextActions: request.nextActions ?? [],
      history: [],
      tags: request.tags ?? [],
    });
    store.cases.push(investmentCase);
    await this.#save(store);
    return this.#enrichCase(investmentCase);
  }

  async updateCase(
    id: string,
    partial: UpdateCaseRequest,
  ): Promise<InvestmentCase> {
    const store = await this.#load();
    const index = store.cases.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Case not found: ${id}`);
    }
    const existing = store.cases[index];
    const updated = investmentCaseSchema.parse({
      ...existing,
      ...(partial.ticker !== undefined ? { ticker: partial.ticker } : {}),
      ...(partial.companyName !== undefined
        ? { companyName: partial.companyName }
        : {}),
      ...(partial.stance !== undefined ? { stance: partial.stance } : {}),
      ...(partial.confidence !== undefined
        ? { confidence: partial.confidence }
        : {}),
      ...(partial.lastReviewedAt !== undefined
        ? { lastReviewedAt: partial.lastReviewedAt }
        : {}),
      ...(partial.sections !== undefined ? { sections: partial.sections } : {}),
      ...(partial.keyAssumptions !== undefined
        ? { keyAssumptions: partial.keyAssumptions }
        : {}),
      ...(partial.invalidationSignals !== undefined
        ? { invalidationSignals: partial.invalidationSignals }
        : {}),
      ...(partial.nextActions !== undefined
        ? { nextActions: partial.nextActions }
        : {}),
      ...(partial.tags !== undefined ? { tags: partial.tags } : {}),
      ...(partial.monitoringEnabled !== undefined
        ? { monitoringEnabled: partial.monitoringEnabled }
        : {}),
      ...(partial.nextCatalystDate !== undefined
        ? { nextCatalystDate: partial.nextCatalystDate }
        : {}),
      ...(partial.nextCatalystDescription !== undefined
        ? { nextCatalystDescription: partial.nextCatalystDescription }
        : {}),
      ...(partial.staleDays !== undefined
        ? { staleDays: partial.staleDays }
        : {}),
      updatedAt: new Date().toISOString(),
    });
    store.cases[index] = updated;
    await this.#save(store);
    return this.#enrichCase(updated);
  }

  async deleteCase(id: string): Promise<{ deleted: true }> {
    const store = await this.#load();
    const index = store.cases.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Case not found: ${id}`);
    }
    store.cases.splice(index, 1);
    await this.#save(store);
    return { deleted: true };
  }

  async addHistoryEntry(
    id: string,
    request: AddCaseHistoryEntryRequest,
  ): Promise<CaseHistoryEntry> {
    const store = await this.#load();
    const index = store.cases.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Case not found: ${id}`);
    }
    const entry = caseHistoryEntrySchema.parse({
      id: randomUUID(),
      date: new Date().toISOString(),
      eventType: request.eventType,
      summary: request.summary,
      ...(request.priorStance !== undefined
        ? { priorStance: request.priorStance }
        : {}),
      ...(request.newStance !== undefined
        ? { newStance: request.newStance }
        : {}),
      ...(request.priorConfidence !== undefined
        ? { priorConfidence: request.priorConfidence }
        : {}),
      ...(request.newConfidence !== undefined
        ? { newConfidence: request.newConfidence }
        : {}),
    });
    const existing = store.cases[index];
    if (!existing) {
      throw new Error(`Case not found: ${id}`);
    }
    existing.history.push(entry);
    store.cases[index] = investmentCaseSchema.parse({
      ...existing,
      updatedAt: new Date().toISOString(),
    });
    await this.#save(store);
    return entry;
  }

  async findByTicker(ticker: string): Promise<InvestmentCase | null> {
    const store = await this.#load();
    const normalized = ticker.toUpperCase();
    const matches = store.cases.filter(
      (c) => c.ticker.toUpperCase() === normalized,
    );
    if (matches.length === 0) {
      return null;
    }
    // Return the most recently reviewed case
    matches.sort(
      (a, b) =>
        new Date(b.lastReviewedAt).getTime() -
        new Date(a.lastReviewedAt).getTime(),
    );
    const best = matches[0];
    if (!best) return null;
    return this.#enrichCase(best);
  }

  async createOrUpdateFromOutput(
    cardOutput: CardOutput,
    workflowType: "deep-dive" | "position-review" | "earnings-xray",
  ): Promise<CaseFromOutputResponse> {
    if (!cardOutput.subject) {
      throw new Error("Subject (ticker) is required for case operations");
    }

    const existingCase = await this.findByTicker(cardOutput.subject);

    // Deep Dive — create or upsert
    if (workflowType === "deep-dive") {
      if (!existingCase) {
        const request = cardOutputToCreateRequest(cardOutput);
        const created = await this.createCase(request);
        const historyEntry = await this.addHistoryEntry(created.id, {
          eventType: "created",
          summary: `Case created via deep dive`,
        });
        return {
          case: await this.getCase(created.id),
          created: true,
          historyEntry,
        };
      }

      // Upsert existing case
      const updateFields = cardOutputToUpdateFields(cardOutput, workflowType);
      const mergedSections = mergeSections(
        existingCase.sections,
        updateFields.sections ?? [],
      );
      const updated = await this.updateCase(existingCase.id, {
        ...updateFields,
        sections: mergedSections,
      });
      const summary = buildChangeSummary(existingCase, updated, workflowType);
      const historyEntry = await this.addHistoryEntry(existingCase.id, {
        eventType: "refreshed",
        summary,
        priorStance: existingCase.stance,
        newStance: updated.stance,
        priorConfidence: existingCase.confidence,
        newConfidence: updated.confidence,
      });
      return {
        case: await this.getCase(existingCase.id),
        created: false,
        historyEntry,
      };
    }

    // Position Review and Earnings X-Ray — require existing case
    if (!existingCase) {
      throw new Error(
        `No existing case found for ${cardOutput.subject.toUpperCase()}`,
      );
    }

    const eventType =
      workflowType === "earnings-xray" ? "earnings-update" : "refreshed";
    const updateFields = cardOutputToUpdateFields(cardOutput, workflowType);
    const mergedSections = mergeSections(
      existingCase.sections,
      updateFields.sections ?? [],
    );
    const updated = await this.updateCase(existingCase.id, {
      ...updateFields,
      sections: mergedSections,
    });
    const summary = buildChangeSummary(existingCase, updated, workflowType);
    const historyEntry = await this.addHistoryEntry(existingCase.id, {
      eventType,
      summary,
      priorStance: existingCase.stance,
      newStance: updated.stance,
      priorConfidence: existingCase.confidence,
      newConfidence: updated.confidence,
    });
    return {
      case: await this.getCase(existingCase.id),
      created: false,
      historyEntry,
    };
  }

  async #load(): Promise<CasesStore> {
    try {
      const raw = await readFile(this.#storePath, "utf-8");
      return JSON.parse(raw) as CasesStore;
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        "code" in error &&
        (error as NodeJS.ErrnoException).code === "ENOENT"
      ) {
        return { version: 1, cases: [] };
      }
      throw error;
    }
  }

  async #save(store: CasesStore): Promise<void> {
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
