import {
  addHoldingRequestSchema,
  portfolioOverviewSchema,
  removeHoldingResponseSchema,
} from "@capyfin/contracts";
import { Hono } from "hono";
import type { SidecarRuntime } from "../context.ts";

export function createPortfolioV2Routes(runtime: SidecarRuntime): Hono {
  const app = new Hono();

  app.get("/", async (context) => {
    const overview = await runtime.portfolioService.getOverview();
    return context.json(portfolioOverviewSchema.parse(overview));
  });

  app.post("/import", async (context) => {
    const body: { csv?: string } = await context.req.json();
    if (!body.csv || typeof body.csv !== "string") {
      return context.json({ error: "CSV content is required." }, 400);
    }
    const overview = await runtime.portfolioService.importFromCsv(body.csv);
    return context.json(portfolioOverviewSchema.parse(overview));
  });

  app.post("/holding", async (context) => {
    const payload = addHoldingRequestSchema.parse(await context.req.json());
    const overview = await runtime.portfolioService.addHolding(payload);
    return context.json(portfolioOverviewSchema.parse(overview));
  });

  app.delete("/holding/:ticker", async (context) => {
    const { ticker } = context.req.param();
    const result = await runtime.portfolioService.removeHolding(ticker);
    return context.json(removeHoldingResponseSchema.parse(result));
  });

  return app;
}
