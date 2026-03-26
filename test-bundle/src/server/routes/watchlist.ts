import {
  addWatchlistItemRequestSchema,
  deleteWatchlistItemResponseSchema,
  updateWatchlistItemRequestSchema,
  watchlistItemSchema,
  watchlistListSchema,
} from "@capyfin/contracts";
import { Hono } from "hono";
import type { SidecarRuntime } from "../context.ts";

export function createWatchlistRoutes(runtime: SidecarRuntime): Hono {
  const app = new Hono();

  app.get("/", async (context) => {
    const items = await runtime.watchlistService.getAll();
    return context.json(watchlistListSchema.parse({ items }));
  });

  app.post("/", async (context) => {
    const payload = addWatchlistItemRequestSchema.parse(
      await context.req.json(),
    );
    try {
      const item = await runtime.watchlistService.add(payload);
      return context.json(watchlistItemSchema.parse(item), 201);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith("Ticker already exists:")
      ) {
        return context.json({ error: error.message }, 409);
      }
      throw error;
    }
  });

  app.put("/:ticker", async (context) => {
    const { ticker } = context.req.param();
    const payload = updateWatchlistItemRequestSchema.parse(
      await context.req.json(),
    );
    try {
      const item = await runtime.watchlistService.update(ticker, payload);
      return context.json(watchlistItemSchema.parse(item));
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith("Ticker not found:")
      ) {
        return context.json({ error: error.message }, 404);
      }
      throw error;
    }
  });

  app.delete("/:ticker", async (context) => {
    const { ticker } = context.req.param();
    try {
      const result = await runtime.watchlistService.remove(ticker);
      return context.json(deleteWatchlistItemResponseSchema.parse(result));
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith("Ticker not found:")
      ) {
        return context.json({ error: error.message }, 404);
      }
      throw error;
    }
  });

  return app;
}
