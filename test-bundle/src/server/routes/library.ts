import {
  deleteReportResponseSchema,
  saveReportRequestSchema,
  savedReportListSchema,
  savedReportSchema,
  updateReportRequestSchema,
} from "@capyfin/contracts";
import { Hono } from "hono";
import type { SidecarRuntime } from "../context.ts";

export function createLibraryRoutes(runtime: SidecarRuntime): Hono {
  const app = new Hono();

  app.get("/", async (context) => {
    const reports = await runtime.libraryService.list();
    return context.json(savedReportListSchema.parse({ reports }));
  });

  app.post("/", async (context) => {
    const payload = saveReportRequestSchema.parse(await context.req.json());
    const report = await runtime.libraryService.save(payload);
    return context.json(savedReportSchema.parse(report));
  });

  app.get("/:id", async (context) => {
    const { id } = context.req.param();
    const report = await runtime.libraryService.get(id);
    return context.json(savedReportSchema.parse(report));
  });

  app.put("/:id", async (context) => {
    const { id } = context.req.param();
    const payload = updateReportRequestSchema.parse(await context.req.json());
    const report = await runtime.libraryService.update(id, payload);
    return context.json(savedReportSchema.parse(report));
  });

  app.delete("/:id", async (context) => {
    const { id } = context.req.param();
    const result = await runtime.libraryService.delete(id);
    return context.json(deleteReportResponseSchema.parse(result));
  });

  return app;
}
