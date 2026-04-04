import {
  addCaseHistoryEntryRequestSchema,
  caseHistoryEntrySchema,
  caseListSchema,
  createCaseRequestSchema,
  deleteCaseResponseSchema,
  investmentCaseSchema,
  updateCaseRequestSchema,
} from "@capyfin/contracts";
import { Hono } from "hono";
import type { SidecarRuntime } from "../context.ts";

export function createCasesRoutes(runtime: SidecarRuntime): Hono {
  const app = new Hono();

  app.get("/", async (context) => {
    const cases = await runtime.casesService.listCases();
    return context.json(caseListSchema.parse({ cases }));
  });

  app.get("/:id", async (context) => {
    const { id } = context.req.param();
    try {
      const investmentCase = await runtime.casesService.getCase(id);
      return context.json(investmentCaseSchema.parse(investmentCase));
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith("Case not found:")
      ) {
        return context.json({ error: error.message }, 404);
      }
      throw error;
    }
  });

  app.post("/", async (context) => {
    const payload = createCaseRequestSchema.parse(await context.req.json());
    const created = await runtime.casesService.createCase(payload);
    return context.json(investmentCaseSchema.parse(created), 201);
  });

  app.patch("/:id", async (context) => {
    const { id } = context.req.param();
    const payload = updateCaseRequestSchema.parse(await context.req.json());
    try {
      const updated = await runtime.casesService.updateCase(id, payload);
      return context.json(investmentCaseSchema.parse(updated));
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith("Case not found:")
      ) {
        return context.json({ error: error.message }, 404);
      }
      throw error;
    }
  });

  app.delete("/:id", async (context) => {
    const { id } = context.req.param();
    try {
      const result = await runtime.casesService.deleteCase(id);
      return context.json(deleteCaseResponseSchema.parse(result));
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith("Case not found:")
      ) {
        return context.json({ error: error.message }, 404);
      }
      throw error;
    }
  });

  app.post("/:id/history", async (context) => {
    const { id } = context.req.param();
    const payload = addCaseHistoryEntryRequestSchema.parse(
      await context.req.json(),
    );
    try {
      const entry = await runtime.casesService.addHistoryEntry(id, payload);
      return context.json(caseHistoryEntrySchema.parse(entry), 201);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith("Case not found:")
      ) {
        return context.json({ error: error.message }, 404);
      }
      throw error;
    }
  });

  return app;
}
