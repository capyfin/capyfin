import {
  dataProviderOverviewSchema,
  dataProviderStatusSchema,
  saveDataProviderKeyRequestSchema,
} from "@capyfin/contracts";
import { Hono } from "hono";
import type { SidecarRuntime } from "../context.ts";

export function createDataProviderRoutes(runtime: SidecarRuntime): Hono {
  const app = new Hono();

  app.get("/data", async (context) => {
    const overview = await runtime.dataProviderService.getAll();
    return context.json(dataProviderOverviewSchema.parse(overview));
  });

  app.put("/data/:providerId", async (context) => {
    const payload = saveDataProviderKeyRequestSchema.parse(
      await context.req.json(),
    );
    const result = await runtime.dataProviderService.saveKey(
      context.req.param("providerId"),
      payload.apiKey,
    );
    return context.json(dataProviderStatusSchema.parse(result));
  });

  app.delete("/data/:providerId", async (context) => {
    await runtime.dataProviderService.deleteKey(
      context.req.param("providerId"),
    );
    return context.body(null, 204);
  });

  return app;
}
