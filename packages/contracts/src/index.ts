import appManifestJson from "../../../config/app-manifest.json" with { type: "json" };
import { z } from "zod";

export const workspaceAreaSchema = z.object({
  path: z.string().min(1),
  responsibility: z.string().min(1),
});

export const appManifestSchema = z.object({
  productName: z.string().min(1),
  workspaceLayout: z.array(workspaceAreaSchema).min(1),
});

export const sidecarConnectionSchema = z.object({
  url: z.url(),
  username: z.string().min(1),
  password: z.string().min(1),
  isSidecar: z.boolean(),
});

export const sidecarHealthSchema = z.object({
  healthy: z.literal(true),
  productName: z.string().min(1),
  version: z.string().min(1),
});

export const sidecarBootstrapSchema = z.object({
  manifest: appManifestSchema,
  runtime: z.object({
    auth: z.literal("basic"),
    mode: z.literal("sidecar"),
    streams: z.object({
      sse: z.boolean(),
      websocket: z.boolean(),
    }),
  }),
  version: z.string().min(1).optional(),
});

export const providerAuthMethodSchema = z.enum([
  "api_key",
  "oauth",
  "token",
  "application_default",
  "aws_sdk",
]);

export const providerDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  authMethods: z.array(providerAuthMethodSchema).min(1),
  envVars: z.array(z.string().min(1)),
  secretType: z.enum(["api_key", "token"]).optional(),
  oauthProviderId: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
});

export const storedProfileSummarySchema = z.object({
  profileId: z.string().min(1),
  providerId: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(["api_key", "oauth", "token"]),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  isActiveProfile: z.boolean(),
});

export const environmentAuthStatusSchema = z.object({
  available: z.boolean(),
  method: providerAuthMethodSchema.optional(),
  sourceLabel: z.string().min(1).optional(),
  envVars: z.array(z.string().min(1)),
});

export const resolvedProviderSourceSchema = z.object({
  source: z.enum(["profile", "environment"]),
  method: providerAuthMethodSchema,
  profileId: z.string().min(1).optional(),
  description: z.string().min(1),
});

export const providerStatusSchema = z.object({
  provider: providerDefinitionSchema,
  isSelectedProvider: z.boolean(),
  isSelectedProfileProvider: z.boolean(),
  profiles: z.array(storedProfileSummarySchema),
  selectedProfileId: z.string().min(1).optional(),
  environment: environmentAuthStatusSchema,
  resolved: resolvedProviderSourceSchema.optional(),
});

export const authOverviewSchema = z.object({
  storePath: z.string().min(1),
  selectedProviderId: z.string().min(1).optional(),
  selectedProfileId: z.string().min(1).optional(),
  providers: z.array(providerStatusSchema),
});

export const connectProviderSecretRequestSchema = z.object({
  providerId: z.string().min(1),
  label: z.string().min(1).optional(),
  secret: z.string().min(1),
});

export const selectProviderRequestSchema = z.object({
  selector: z.string().min(1),
});

export const startOAuthSessionRequestSchema = z.object({
  providerId: z.string().min(1),
  label: z.string().min(1).optional(),
});

export const submitOAuthSessionPromptRequestSchema = z.object({
  value: z.string(),
});

export const agentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1).optional(),
  instructions: z.string().min(1),
  providerId: z.string().min(1).optional(),
  modelId: z.string().min(1).optional(),
  workspaceDir: z.string().min(1),
  agentDir: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  isDefault: z.boolean(),
});

export const agentCatalogSchema = z.object({
  storePath: z.string().min(1),
  defaultAgentId: z.string().min(1),
  agents: z.array(agentSchema),
});

export const createAgentRequestSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1),
  description: z.string().min(1).optional(),
  instructions: z.string().min(1).optional(),
  providerId: z.string().min(1).optional(),
  modelId: z.string().min(1).optional(),
  workspaceDir: z.string().min(1).optional(),
  setAsDefault: z.boolean().optional(),
});

export const updateAgentRequestSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  instructions: z.string().min(1).optional(),
  providerId: z.string().min(1).optional(),
  modelId: z.string().min(1).optional(),
  workspaceDir: z.string().min(1).optional(),
  setAsDefault: z.boolean().optional(),
});

export const deleteAgentResponseSchema = z.object({
  agentId: z.string().min(1),
  deletedSessions: z.number().int().nonnegative(),
  removedPaths: z.array(z.string().min(1)),
});

export const agentSessionSchema = z.object({
  id: z.string().min(1),
  agentId: z.string().min(1),
  agentName: z.string().min(1),
  sessionKey: z.string().min(1),
  label: z.string().min(1).optional(),
  sessionFile: z.string().min(1),
  workspaceDir: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const agentSessionListSchema = z.object({
  agentId: z.string().min(1).optional(),
  sessions: z.array(agentSessionSchema),
});

export const createAgentSessionRequestSchema = z.object({
  agentId: z.string().min(1),
  label: z.string().min(1).optional(),
  initialPrompt: z.string().min(1).optional(),
});

export const oauthSessionStepSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("working"),
    message: z.string().min(1),
  }),
  z.object({
    type: z.literal("auth_link"),
    url: z.url(),
    instructions: z.string().min(1).optional(),
  }),
  z.object({
    type: z.literal("prompt"),
    message: z.string().min(1),
    placeholder: z.string().min(1).optional(),
    allowEmpty: z.boolean(),
  }),
  z.object({
    type: z.literal("completed"),
  }),
  z.object({
    type: z.literal("error"),
    message: z.string().min(1),
  }),
]);

export const oauthSessionSchema = z.object({
  id: z.string().min(1),
  providerId: z.string().min(1),
  providerName: z.string().min(1),
  state: z.enum(["pending", "completed", "error"]),
  step: oauthSessionStepSchema,
  authUrl: z.url().optional(),
  authInstructions: z.string().min(1).optional(),
  progress: z.array(z.string()),
  profile: storedProfileSummarySchema.optional(),
  error: z.string().min(1).optional(),
});

export type WorkspaceArea = z.infer<typeof workspaceAreaSchema>;
export type AppManifest = z.infer<typeof appManifestSchema>;
export type SidecarConnection = z.infer<typeof sidecarConnectionSchema>;
export type SidecarHealth = z.infer<typeof sidecarHealthSchema>;
export type SidecarBootstrap = z.infer<typeof sidecarBootstrapSchema>;
export type ProviderAuthMethod = z.infer<typeof providerAuthMethodSchema>;
export type ProviderDefinition = z.infer<typeof providerDefinitionSchema>;
export type StoredProfileSummary = z.infer<typeof storedProfileSummarySchema>;
export type EnvironmentAuthStatus = z.infer<typeof environmentAuthStatusSchema>;
export type ResolvedProviderSource = z.infer<typeof resolvedProviderSourceSchema>;
export type ProviderStatus = z.infer<typeof providerStatusSchema>;
export type AuthOverview = z.infer<typeof authOverviewSchema>;
export type ConnectProviderSecretRequest = z.infer<
  typeof connectProviderSecretRequestSchema
>;
export type SelectProviderRequest = z.infer<typeof selectProviderRequestSchema>;
export type StartOAuthSessionRequest = z.infer<
  typeof startOAuthSessionRequestSchema
>;
export type SubmitOAuthSessionPromptRequest = z.infer<
  typeof submitOAuthSessionPromptRequestSchema
>;
export type OAuthSessionStep = z.infer<typeof oauthSessionStepSchema>;
export type OAuthSession = z.infer<typeof oauthSessionSchema>;
export type Agent = z.infer<typeof agentSchema>;
export type AgentCatalog = z.infer<typeof agentCatalogSchema>;
export type CreateAgentRequest = z.infer<typeof createAgentRequestSchema>;
export type UpdateAgentRequest = z.infer<typeof updateAgentRequestSchema>;
export type DeleteAgentResponse = z.infer<typeof deleteAgentResponseSchema>;
export type AgentSession = z.infer<typeof agentSessionSchema>;
export type AgentSessionList = z.infer<typeof agentSessionListSchema>;
export type CreateAgentSessionRequest = z.infer<
  typeof createAgentSessionRequestSchema
>;

export const appManifest = appManifestSchema.parse(appManifestJson);

export function createBasicAuthHeader(
  username: string,
  password: string,
): string {
  if (typeof btoa === "function") {
    return `Basic ${btoa(`${username}:${password}`)}`;
  }

  const nodeBuffer = (
    globalThis as {
      Buffer?: {
        from(
          input: string,
          encoding: string,
        ): { toString(encoding: string): string };
      };
    }
  ).Buffer;

  if (nodeBuffer) {
    return `Basic ${nodeBuffer
      .from(`${username}:${password}`, "utf8")
      .toString("base64")}`;
  }

  throw new Error("No base64 encoder is available in the current runtime.");
}
