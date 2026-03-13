import {
  authOverviewSchema,
  connectProviderSecretRequestSchema,
  oauthSessionSchema,
  providerStatusSchema,
  selectProviderRequestSchema,
  startOAuthSessionRequestSchema,
  storedProfileSummarySchema,
  submitOAuthSessionPromptRequestSchema,
} from "@capyfin/contracts";
import { Hono } from "hono";
import type { SidecarRuntime } from "../context.ts";

export function createAuthRoutes(runtime: SidecarRuntime): Hono {
  const app = new Hono();

  app.get("/overview", async (context) => {
    const authOverview = await runtime.createAuthService().getOverview();
    return context.json(authOverviewSchema.parse(authOverview));
  });

  app.post("/credentials", async (context) => {
    const payload = connectProviderSecretRequestSchema.parse(
      await context.req.json(),
    );
    const summary = await runtime.createAuthService().saveSecretProfile(payload);

    return context.json(storedProfileSummarySchema.parse(summary), 201);
  });

  app.post("/select", async (context) => {
    const payload = selectProviderRequestSchema.parse(await context.req.json());
    const providerStatus = await runtime
      .createAuthService()
      .selectProvider(payload.selector);

    return context.json(providerStatusSchema.parse(providerStatus));
  });

  app.delete("/profiles/:profileId", async (context) => {
    await runtime
      .createAuthService()
      .deleteProfile(context.req.param("profileId"));

    return context.body(null, 204);
  });

  app.post("/oauth/start", async (context) => {
    const payload = startOAuthSessionRequestSchema.parse(await context.req.json());
    const session = runtime.authSessions.start({
      ...(payload.label ? { label: payload.label } : {}),
      providerId: payload.providerId,
    });
    return context.json(oauthSessionSchema.parse(session), 202);
  });

  app.get("/oauth/sessions/:sessionId", (context) => {
    const session = runtime.authSessions.get(context.req.param("sessionId"));
    if (!session) {
      return context.json({ error: "OAuth session not found" }, 404);
    }

    return context.json(oauthSessionSchema.parse(session));
  });

  app.post("/oauth/sessions/:sessionId/respond", async (context) => {
    const payload = submitOAuthSessionPromptRequestSchema.parse(
      await context.req.json(),
    );
    const session = runtime.authSessions.respond(
      context.req.param("sessionId"),
      payload.value,
    );

    return context.json(oauthSessionSchema.parse(session));
  });

  return app;
}
