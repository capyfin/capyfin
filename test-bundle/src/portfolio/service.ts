import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  portfolioOverviewSchema,
  type AddHoldingRequest,
  type PortfolioHolding,
  type PortfolioOverview,
} from "@capyfin/contracts";
import { parseCsv } from "./csv-parser.ts";

interface PortfolioStore {
  version: 1;
  holdings: PortfolioHolding[];
}

const POSITION_THRESHOLD = 20;
const SECTOR_THRESHOLD = 40;

export class PortfolioService {
  readonly #storePath: string;
  readonly #workspaceDir: string;

  constructor(stateDir: string, workspaceDir: string) {
    this.#storePath = join(stateDir, "portfolio.json");
    this.#workspaceDir = workspaceDir;
  }

  async getOverview(): Promise<PortfolioOverview> {
    const store = await this.#load();
    return this.#computeOverview(store.holdings);
  }

  async addHolding(request: AddHoldingRequest): Promise<PortfolioOverview> {
    const store = await this.#load();
    const holding: PortfolioHolding = {
      ticker: request.ticker.toUpperCase(),
      name: request.name,
      shares: request.shares,
      costBasis: request.costBasis,
      sector: request.sector,
      weight: 0,
      addedAt: new Date().toISOString(),
    };
    store.holdings.push(holding);
    const overview = this.#computeOverview(store.holdings);
    store.holdings = overview.holdings;
    await this.#save(store);
    await this.#writeCsvToWorkspace(store.holdings);
    return overview;
  }

  async removeHolding(ticker: string): Promise<{ deleted: boolean }> {
    const store = await this.#load();
    const upperTicker = ticker.toUpperCase();
    const index = store.holdings.findIndex(
      (h) => h.ticker.toUpperCase() === upperTicker,
    );
    if (index === -1) {
      return { deleted: false };
    }
    store.holdings.splice(index, 1);
    const overview = this.#computeOverview(store.holdings);
    store.holdings = overview.holdings;
    await this.#save(store);
    await this.#writeCsvToWorkspace(store.holdings);
    return { deleted: true };
  }

  async importFromCsv(csv: string): Promise<PortfolioOverview> {
    const parsed = parseCsv(csv);
    const holdings: PortfolioHolding[] = parsed.rows.map((row) => ({
      ticker: row.ticker.toUpperCase(),
      name: row.name,
      shares: row.shares,
      costBasis: row.costBasis,
      sector: row.sector,
      weight: 0,
      addedAt: new Date().toISOString(),
    }));
    const overview = this.#computeOverview(holdings);
    const store: PortfolioStore = { version: 1, holdings: overview.holdings };
    await this.#save(store);
    await this.#writeCsvToWorkspace(store.holdings);
    return overview;
  }

  #computeOverview(holdings: PortfolioHolding[]): PortfolioOverview {
    const totalValue = holdings.reduce(
      (sum, h) => sum + h.shares * h.costBasis,
      0,
    );

    const withWeights = holdings.map((h) => ({
      ...h,
      weight:
        totalValue > 0
          ? Math.round((h.shares * h.costBasis * 10000) / totalValue) / 100
          : 0,
    }));

    // Sector exposure
    const sectorMap = new Map<string, number>();
    for (const h of withWeights) {
      const sector = h.sector ?? "Unclassified";
      sectorMap.set(sector, (sectorMap.get(sector) ?? 0) + h.weight);
    }
    const sectorExposure = [...sectorMap.entries()]
      .map(([sector, weight]) => ({
        sector,
        weight: Math.round(weight * 100) / 100,
      }))
      .sort((a, b) => b.weight - a.weight);

    // Concentration alerts
    const concentrationAlerts: PortfolioOverview["concentrationAlerts"] = [];
    for (const h of withWeights) {
      if (h.weight > POSITION_THRESHOLD) {
        concentrationAlerts.push({
          type: "position",
          name: h.ticker,
          weight: h.weight,
        });
      }
    }
    for (const { sector, weight } of sectorExposure) {
      if (weight > SECTOR_THRESHOLD) {
        concentrationAlerts.push({ type: "sector", name: sector, weight });
      }
    }

    return portfolioOverviewSchema.parse({
      holdings: withWeights,
      totalValue,
      sectorExposure,
      concentrationAlerts,
    });
  }

  async #writeCsvToWorkspace(holdings: PortfolioHolding[]): Promise<void> {
    await mkdir(this.#workspaceDir, { recursive: true });
    const header = "ticker,shares,cost basis,name,sector";
    const rows = holdings.map(
      (h) =>
        `${h.ticker},${String(h.shares)},${String(h.costBasis)},${h.name ?? ""},${h.sector ?? ""}`,
    );
    const csv = [header, ...rows].join("\n") + "\n";
    await writeFile(join(this.#workspaceDir, "portfolio.csv"), csv, "utf-8");
  }

  async #load(): Promise<PortfolioStore> {
    try {
      const raw = await readFile(this.#storePath, "utf-8");
      return JSON.parse(raw) as PortfolioStore;
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        "code" in error &&
        (error as NodeJS.ErrnoException).code === "ENOENT"
      ) {
        return { version: 1, holdings: [] };
      }
      throw error;
    }
  }

  async #save(store: PortfolioStore): Promise<void> {
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
