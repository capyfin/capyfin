/* eslint-disable @typescript-eslint/consistent-type-definitions, @typescript-eslint/no-dynamic-delete, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/unbound-method */

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  type AuthOverview,
  type ProviderConnectionInput,
  type ProviderDefinition,
  type SavedConnection,
} from "@capyfin/contracts";
import { DEFAULT_AGENT_ID } from "@capyfin/core/agents";
import type { EmbeddedGatewayPaths } from "../internal-gateway/paths.ts";
import { resolveGatewayAgentDir } from "../internal-gateway/paths.ts";
import {
  loadAuthChoiceModule,
  loadAuthChoiceOptionsModule,
  type RuntimeEnvLike,
  type WizardPrompterLike,
} from "./runtime-modules.ts";

type GatewayConfig = Record<string, any>;

type RuntimeAuthCredential =
  | {
      email?: string;
      provider: string;
      type: "oauth";
    }
  | {
      key?: string;
      provider: string;
      type: "api_key";
    }
  | {
      provider: string;
      token?: string;
      type: "token";
    };

type RuntimeAuthStore = {
  lastGood?: Record<string, string>;
  order?: Record<string, string[]>;
  profiles: Record<string, RuntimeAuthCredential>;
  usageStats?: Record<string, unknown>;
  version: number;
};

type ConnectionMetadataStore = {
  updatedAtByProfileId: Record<string, string>;
  version: 1;
};

type ApplyAuthChoiceOutcome = {
  connection?: SavedConnection;
  overview: AuthOverview;
};

const CONNECTION_METADATA_VERSION = 1 as const;

function createEmptyAuthStore(): RuntimeAuthStore {
  return {
    profiles: {},
    version: 1,
  };
}

function createEmptyMetadataStore(): ConnectionMetadataStore {
  return {
    updatedAtByProfileId: {},
    version: CONNECTION_METADATA_VERSION,
  };
}

function normalizeAuthStore(raw: unknown): RuntimeAuthStore {
  if (!raw || typeof raw !== "object") {
    return createEmptyAuthStore();
  }

  const record = raw as Record<string, unknown>;
  const rawProfiles =
    record.profiles && typeof record.profiles === "object"
      ? (record.profiles as Record<string, unknown>)
      : {};

  const profiles: Record<string, RuntimeAuthCredential> = {};
  for (const [profileId, value] of Object.entries(rawProfiles)) {
    if (!value || typeof value !== "object") {
      continue;
    }

    const credential = value as Record<string, unknown>;
    const provider =
      typeof credential.provider === "string" && credential.provider.trim()
        ? credential.provider.trim()
        : "";
    const type =
      credential.type === "api_key" ||
      credential.type === "oauth" ||
      credential.type === "token"
        ? credential.type
        : undefined;

    if (!provider || !type) {
      continue;
    }

    if (type === "api_key") {
      const normalizedKey =
        typeof credential.key === "string" && credential.key.trim()
          ? credential.key.trim()
          : undefined;
      profiles[profileId] = {
        ...(normalizedKey ? { key: normalizedKey } : {}),
        provider,
        type,
      };
      continue;
    }

    if (type === "token") {
      const normalizedToken =
        typeof credential.token === "string" && credential.token.trim()
          ? credential.token.trim()
          : undefined;
      profiles[profileId] = {
        provider,
        ...(normalizedToken ? { token: normalizedToken } : {}),
        type,
      };
      continue;
    }

    const normalizedEmail =
      typeof credential.email === "string" && credential.email.trim()
        ? credential.email.trim()
        : undefined;
    profiles[profileId] = {
      ...(normalizedEmail ? { email: normalizedEmail } : {}),
      provider,
      type,
    };
  }

  return {
    ...(record.lastGood && typeof record.lastGood === "object"
      ? { lastGood: record.lastGood as Record<string, string> }
      : {}),
    ...(record.order && typeof record.order === "object"
      ? { order: record.order as Record<string, string[]> }
      : {}),
    profiles,
    ...(record.usageStats && typeof record.usageStats === "object"
      ? { usageStats: record.usageStats as Record<string, unknown> }
      : {}),
    version: typeof record.version === "number" ? record.version : 1,
  };
}

function normalizeMetadataStore(raw: unknown): ConnectionMetadataStore {
  if (!raw || typeof raw !== "object") {
    return createEmptyMetadataStore();
  }

  const record = raw as Record<string, unknown>;
  return {
    updatedAtByProfileId:
      record.updatedAtByProfileId && typeof record.updatedAtByProfileId === "object"
        ? Object.fromEntries(
            Object.entries(record.updatedAtByProfileId as Record<string, unknown>).flatMap(
              ([profileId, value]) =>
                typeof value === "string" && value.trim()
                  ? ([[profileId, value.trim()]] as const)
                  : [],
            ),
          )
        : {},
    version: CONNECTION_METADATA_VERSION,
  };
}

async function loadJsonFile<T>(
  filePath: string,
  fallback: () => T,
  normalize: (raw: unknown) => T,
): Promise<T> {
  try {
    const source = await readFile(filePath, "utf8");
    return normalize(JSON.parse(source) as unknown);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return fallback();
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON at ${filePath}.`);
    }
    throw error;
  }
}

async function writeJsonFile(filePath: string, payload: unknown): Promise<void> {
  const directory = dirname(filePath);
  const temporaryPath = join(
    directory,
    `.tmp-${String(process.pid)}-${String(Date.now())}-${randomUUID()}.json`,
  );

  await mkdir(directory, { recursive: true, mode: 0o700 });
  await writeFile(temporaryPath, `${JSON.stringify(payload, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });

  try {
    await rename(temporaryPath, filePath);
  } catch (error) {
    await rm(temporaryPath, { force: true });
    throw error;
  }
}

function normalizeChoiceLabel(label: string): string {
  const trimmed = label.trim();
  if (trimmed === "OpenAI Codex (ChatGPT OAuth)") {
    return "ChatGPT (Codex)";
  }
  if (trimmed === "OpenAI API key") {
    return "Use API key";
  }
  if (trimmed === "GitHub Copilot (GitHub device login)") {
    return "Sign in with GitHub";
  }
  if (trimmed === "Anthropic API key") {
    return "Use API key";
  }
  return trimmed;
}

function inferMethodInput(params: {
  authChoice: string;
  label: string;
}): ProviderConnectionInput {
  const choice = params.authChoice.trim().toLowerCase();
  const label = params.label.trim().toLowerCase();

  if (choice === "github-copilot") {
    return "device_code";
  }
  if (choice.includes("oauth") || choice === "openai-codex" || choice === "chutes") {
    return "oauth";
  }
  if (choice === "token" || label.includes("token")) {
    return "token";
  }
  if (choice.includes("api-key") || label.includes("api key")) {
    return "api_key";
  }
  return "custom";
}

function resolveDefaultModelRef(config: GatewayConfig): string | undefined {
  const model = config.agents?.defaults?.model;
  if (typeof model === "string" && model.trim()) {
    return model.trim();
  }
  if (
    model &&
    typeof model === "object" &&
    typeof (model as { primary?: unknown }).primary === "string" &&
    (model as { primary: string }).primary.trim()
  ) {
    return (model as { primary: string }).primary.trim();
  }
  return undefined;
}

function splitModelRef(modelRef?: string): {
  modelId?: string;
  providerId?: string;
} {
  const normalized = modelRef?.trim();
  if (!normalized) {
    return {};
  }

  const separator = normalized.indexOf("/");
  if (separator <= 0) {
    return {
      modelId: normalized,
    };
  }

  return {
    modelId: normalized.slice(separator + 1),
    providerId: normalized.slice(0, separator),
  };
}

function resolveConfiguredModelForProvider(
  config: GatewayConfig,
  providerId: string,
): string | undefined {
  const primary = splitModelRef(resolveDefaultModelRef(config));
  if (primary.providerId === providerId) {
    return primary.modelId;
  }

  const models =
    config.agents?.defaults?.models && typeof config.agents.defaults.models === "object"
      ? (config.agents.defaults.models as Record<string, unknown>)
      : {};
  const match = Object.keys(models).find((modelRef) => splitModelRef(modelRef).providerId === providerId);
  return match ? splitModelRef(match).modelId : undefined;
}

function dedupeProfileOrder(profileIds: string[]): string[] {
  return [...new Set(profileIds)];
}

function resolveStorePath(paths: EmbeddedGatewayPaths): string {
  return join(resolveGatewayAgentDir(paths, DEFAULT_AGENT_ID), "auth-profiles.json");
}

function resolveConnectionMetadataPath(paths: EmbeddedGatewayPaths): string {
  return join(paths.rootDir, "connection-metadata.json");
}

function resolveAuthStoreProfileIds(store: RuntimeAuthStore, providerId: string): string[] {
  return Object.entries(store.profiles)
    .filter(([, credential]) => credential.provider === providerId)
    .map(([profileId]) => profileId);
}

function resolveSelectedProfileForProvider(
  config: GatewayConfig,
  store: RuntimeAuthStore,
  providerId: string,
): string | undefined {
  const storeOrder = store.order?.[providerId] ?? [];
  const configOrder = config.auth?.order?.[providerId] ?? [];
  const ordered = dedupeProfileOrder([
    ...storeOrder,
    ...configOrder,
    ...resolveAuthStoreProfileIds(store, providerId),
  ]);

  return ordered.find((profileId) => Boolean(store.profiles[profileId]));
}

function resolveProfileLabel(profileId: string, credential: RuntimeAuthCredential): string {
  if (credential.type === "oauth" && credential.email?.trim()) {
    return credential.email.trim();
  }

  const separator = profileId.lastIndexOf(":");
  const suffix = separator >= 0 ? profileId.slice(separator + 1).trim() : "";
  return suffix || profileId;
}

function buildSelection(params: {
  config: GatewayConfig;
  connections: SavedConnection[];
  store: RuntimeAuthStore;
}): {
  selectedModelId?: string;
  selectedProfileId?: string;
  selectedProviderId?: string;
} {
  const defaultModel = splitModelRef(resolveDefaultModelRef(params.config));
  const defaultProviderWithConnection =
    defaultModel.providerId &&
    params.connections.some((connection) => connection.providerId === defaultModel.providerId)
      ? defaultModel.providerId
      : undefined;
  const selectedProviderId =
    defaultProviderWithConnection ?? params.connections.find((connection) => connection.isDefault)?.providerId;
  if (!selectedProviderId) {
    return {};
  }

  const selectedProfileId =
    resolveSelectedProfileForProvider(params.config, params.store, selectedProviderId) ??
    params.connections.find((connection) => connection.providerId === selectedProviderId)?.profileId;

  return {
    ...(defaultModel.providerId === selectedProviderId && defaultModel.modelId
      ? { selectedModelId: defaultModel.modelId }
      : {}),
    ...(selectedProfileId ? { selectedProfileId } : {}),
    selectedProviderId,
  };
}

function hasExistingSelection(config: GatewayConfig, store: RuntimeAuthStore): boolean {
  if (Object.keys(store.profiles).length > 0) {
    return true;
  }

  if (
    config.auth?.order &&
    Object.values(config.auth.order).some(
      (profileIds) => Array.isArray(profileIds) && profileIds.length > 0,
    )
  ) {
    return true;
  }

  if (
    config.auth?.profiles &&
    Object.keys(config.auth.profiles).length > 0
  ) {
    return true;
  }

  return Boolean(resolveDefaultModelRef(config));
}

function createRuntimeEnv(): RuntimeEnvLike {
  return {
    error: (...args) => {
      console.error("[sidecar-auth]", ...args);
    },
    exit: (code) => {
      throw new Error(`embedded runtime requested exit ${String(code)}`);
    },
    log: (...args) => {
      console.log("[sidecar-auth]", ...args);
    },
  };
}

export class RuntimeProviderAuthService {
  readonly #paths: EmbeddedGatewayPaths;
  readonly #runtimeEnv: RuntimeEnvLike;

  constructor(paths: EmbeddedGatewayPaths) {
    this.#paths = paths;
    this.#runtimeEnv = createRuntimeEnv();
  }

  getStorePath(): string {
    return resolveStorePath(this.#paths);
  }

  getConfigPath(): string {
    return this.#paths.configPath;
  }

  async getOverview(): Promise<AuthOverview> {
    const [config, store, metadata, providers] = await Promise.all([
      this.#loadConfig(),
      this.#loadStore(),
      this.#loadMetadata(),
      this.#listProviders(),
    ]);
    const connections = await this.#buildConnections({
      config,
      metadata,
      providers,
      store,
    });
    const selection = buildSelection({ config, connections, store });

    return {
      configPath: this.#paths.configPath,
      connections,
      providers,
      selectedModelId: selection.selectedModelId,
      selectedProfileId: selection.selectedProfileId,
      selectedProviderId: selection.selectedProviderId,
      storePath: this.getStorePath(),
    };
  }

  async connectSecret(params: {
    authChoice: string;
    secret: string;
  }): Promise<SavedConnection> {
    const method = await this.getMethod(params.authChoice);
    if (method.input !== "api_key" && method.input !== "token" && method.input !== "custom") {
      throw new Error(`${method.label} requires an interactive sign-in flow.`);
    }

    const result = await this.applyAuthChoice({
      authChoice: params.authChoice,
      prompter: createSingleSecretPrompter(params.secret),
    });

    if (!result.connection) {
      throw new Error(`Connected ${method.label}, but no saved connection was created.`);
    }

    return result.connection;
  }

  async selectProfile(profileId: string): Promise<SavedConnection> {
    const [config, store, metadata] = await Promise.all([
      this.#loadConfig(),
      this.#loadStore(),
      this.#loadMetadata(),
    ]);
    const credential = store.profiles[profileId];
    if (!credential) {
      throw new Error(`Unknown connection: ${profileId}`);
    }

    const providerId = credential.provider;
    const ordered = dedupeProfileOrder([
      profileId,
      ...(store.order?.[providerId] ?? []),
      ...(config.auth?.order?.[providerId] ?? []),
      ...resolveAuthStoreProfileIds(store, providerId),
    ]).filter((candidate) => candidate !== profileId || Boolean(store.profiles[candidate]));

    store.order = {
      ...(store.order ?? {}),
      [providerId]: ordered,
    };
    config.auth = {
      ...(config.auth ?? {}),
      order: {
        ...(config.auth?.order ?? {}),
        [providerId]: ordered,
      },
      profiles: {
        ...(config.auth?.profiles ?? {}),
        ...(config.auth?.profiles?.[profileId]
          ? {}
          : {
              [profileId]: {
                mode: credential.type,
                provider: providerId,
              },
            }),
      },
    };

    const timestamp = new Date().toISOString();
    metadata.updatedAtByProfileId[profileId] = timestamp;

    await Promise.all([
      writeJsonFile(this.getStorePath(), store),
      writeJsonFile(this.getConfigPath(), config),
      this.#saveMetadata(metadata),
    ]);

    const overview = await this.getOverview();
    const selected = overview.connections.find((connection) => connection.profileId === profileId);
    if (!selected) {
      throw new Error(`Connection ${profileId} could not be selected.`);
    }
    return selected;
  }

  async deleteProfile(profileId: string): Promise<void> {
    const [config, store, metadata] = await Promise.all([
      this.#loadConfig(),
      this.#loadStore(),
      this.#loadMetadata(),
    ]);
    const credential = store.profiles[profileId];
    if (!credential) {
      return;
    }

    delete store.profiles[profileId];
    if (store.lastGood) {
      for (const [providerId, currentProfileId] of Object.entries(store.lastGood)) {
        if (currentProfileId === profileId) {
          delete store.lastGood[providerId];
        }
      }
      if (Object.keys(store.lastGood).length === 0) {
        delete store.lastGood;
      }
    }

    const currentStoreOrder = store.order?.[credential.provider];
    if (currentStoreOrder) {
      const nextOrder = currentStoreOrder.filter(
        (candidate) => candidate !== profileId,
      );
      if (nextOrder.length > 0) {
        store.order = store.order ?? {};
        store.order[credential.provider] = nextOrder;
      } else {
        delete store.order?.[credential.provider];
      }
      if (store.order && Object.keys(store.order).length === 0) {
        delete store.order;
      }
    }

    if (store.usageStats?.[profileId]) {
      delete store.usageStats[profileId];
      if (Object.keys(store.usageStats).length === 0) {
        delete store.usageStats;
      }
    }

    if (config.auth?.profiles?.[profileId]) {
      delete config.auth.profiles[profileId];
      if (Object.keys(config.auth.profiles).length === 0) {
        delete config.auth.profiles;
      }
    }
    if (config.auth?.order?.[credential.provider]) {
      const nextOrder = config.auth.order[credential.provider].filter(
        (candidate: string) => candidate !== profileId,
      );
      if (nextOrder.length > 0) {
        config.auth.order[credential.provider] = nextOrder;
      } else {
        delete config.auth.order[credential.provider];
      }
      if (Object.keys(config.auth.order).length === 0) {
        delete config.auth.order;
      }
    }

    delete metadata.updatedAtByProfileId[profileId];

    await Promise.all([
      writeJsonFile(this.getStorePath(), store),
      writeJsonFile(this.getConfigPath(), config),
      this.#saveMetadata(metadata),
    ]);
  }

  async applyAuthChoice(params: {
    authChoice: string;
    prompter: WizardPrompterLike;
  }): Promise<ApplyAuthChoiceOutcome> {
    const [{ applyAuthChoice }, method, previousConfig, previousStore, metadata] =
      await Promise.all([
        loadAuthChoiceModule(),
        this.getMethod(params.authChoice),
        this.#loadConfig(),
        this.#loadStore(),
        this.#loadMetadata(),
      ]);

    const hadSelection = hasExistingSelection(previousConfig, previousStore);
    const agentDir = resolveGatewayAgentDir(this.#paths, DEFAULT_AGENT_ID);
    const result = await applyAuthChoice({
      agentDir,
      authChoice: params.authChoice,
      config: previousConfig,
      prompter: params.prompter,
      runtime: this.#runtimeEnv,
      setDefaultModel: !hadSelection,
    });

    await writeJsonFile(this.getConfigPath(), result.config);

    const nextStore = await this.#loadStore();
    const touchedProfileIds = resolveTouchedProfiles({
      nextStore,
      previousStore,
      providerId: method.providerId,
    });
    const timestamp = new Date().toISOString();
    for (const profileId of touchedProfileIds) {
      metadata.updatedAtByProfileId[profileId] = timestamp;
    }
    if (touchedProfileIds.length > 0) {
      await this.#saveMetadata(metadata);
    }

    const overview = await this.getOverview();
    const connection = resolvePreferredConnection({
      authChoice: params.authChoice,
      connections: overview.connections,
      method,
      touchedProfileIds,
    });

    return {
      ...(connection ? { connection } : {}),
      overview,
    };
  }

  async getMethod(authChoice: string): Promise<{
    hint?: string;
    input: ProviderConnectionInput;
    label: string;
    providerId: string;
    providerName: string;
  }> {
    const providers = await this.#listProviders();
    for (const provider of providers) {
      const method = provider.methods.find((candidate) => candidate.id === authChoice);
      if (method) {
        return {
          ...(method.hint ? { hint: method.hint } : {}),
          input: method.input,
          label: method.label,
          providerId: method.providerId,
          providerName: provider.name,
        };
      }
    }

    throw new Error(`Unsupported provider choice: ${authChoice}`);
  }

  async #listProviders(): Promise<ProviderDefinition[]> {
    const [{ buildAuthChoiceGroups }, { resolvePreferredProviderForAuthChoice }, config, store] =
      await Promise.all([
        loadAuthChoiceOptionsModule(),
        loadAuthChoiceModule(),
        this.#loadConfig(),
        this.#loadStore(),
      ]);

    const workspaceDir = join(this.#paths.workspacesDir, DEFAULT_AGENT_ID);
    const { groups } = buildAuthChoiceGroups({
      config,
      env: process.env,
      includeSkip: false,
      store,
      workspaceDir,
    });

    return groups
      .filter((group) => group.options.length > 0)
      .map((group) => ({
        ...(group.hint ? { description: group.hint } : {}),
        id: group.value,
        methods: group.options.map((option) => ({
          ...(option.hint ? { hint: option.hint } : {}),
          id: option.value,
          input: inferMethodInput({
            authChoice: option.value,
            label: option.label,
          }),
          label: normalizeChoiceLabel(option.label),
          providerId:
            resolvePreferredProviderForAuthChoice({
              choice: option.value,
              config,
              env: process.env,
              workspaceDir,
            }) ?? group.value,
        })),
        name: group.label,
      }));
  }

  async #buildConnections(params: {
    config: GatewayConfig;
    metadata: ConnectionMetadataStore;
    providers: ProviderDefinition[];
    store: RuntimeAuthStore;
  }): Promise<SavedConnection[]> {
    const providerNameById = new Map<string, string>();
    for (const provider of params.providers) {
      for (const method of provider.methods) {
        if (!providerNameById.has(method.providerId)) {
          providerNameById.set(method.providerId, method.label === "Use API key" ? provider.name : method.label);
        }
      }
      if (!providerNameById.has(provider.id)) {
        providerNameById.set(provider.id, provider.name);
      }
    }

    let storeUpdatedAt = new Date(0).toISOString();
    try {
      storeUpdatedAt = (await stat(this.getStorePath())).mtime.toISOString();
    } catch {
      // Ignore missing store path.
    }

    const connections = Object.entries(params.store.profiles)
      .map(([profileId, credential]) => {
        const providerId = credential.provider;
        const updatedAt =
          params.metadata.updatedAtByProfileId[profileId] ?? storeUpdatedAt;
        return {
          ...(resolveConfiguredModelForProvider(params.config, providerId)
            ? { activeModelId: resolveConfiguredModelForProvider(params.config, providerId) }
            : {}),
          isDefault:
            resolveSelectedProfileForProvider(params.config, params.store, providerId) ===
            profileId,
          label: resolveProfileLabel(profileId, credential),
          profileId,
          providerId,
          providerName: providerNameById.get(providerId) ?? providerId,
          type: credential.type,
          updatedAt,
        } satisfies SavedConnection;
      })
      .sort((left, right) => {
        if (left.isDefault !== right.isDefault) {
          return left.isDefault ? -1 : 1;
        }
        return right.updatedAt.localeCompare(left.updatedAt);
      });

    return connections;
  }

  async #loadConfig(): Promise<GatewayConfig> {
    return await loadJsonFile(this.getConfigPath(), () => ({}), (raw) =>
      raw && typeof raw === "object" ? ({ ...(raw as Record<string, unknown>) } as GatewayConfig) : {},
    );
  }

  async #loadStore(): Promise<RuntimeAuthStore> {
    return await loadJsonFile(this.getStorePath(), createEmptyAuthStore, normalizeAuthStore);
  }

  async #loadMetadata(): Promise<ConnectionMetadataStore> {
    return await loadJsonFile(
      resolveConnectionMetadataPath(this.#paths),
      createEmptyMetadataStore,
      normalizeMetadataStore,
    );
  }

  async #saveMetadata(metadata: ConnectionMetadataStore): Promise<void> {
    await writeJsonFile(resolveConnectionMetadataPath(this.#paths), metadata);
  }
}

function resolveTouchedProfiles(params: {
  nextStore: RuntimeAuthStore;
  previousStore: RuntimeAuthStore;
  providerId: string;
}): string[] {
  const touched = new Set<string>();

  for (const [profileId, credential] of Object.entries(params.nextStore.profiles)) {
    if (credential.provider !== params.providerId) {
      continue;
    }

    const previous = params.previousStore.profiles[profileId];
    if (!previous || JSON.stringify(previous) !== JSON.stringify(credential)) {
      touched.add(profileId);
    }
  }

  return [...touched];
}

function resolvePreferredConnection(params: {
  authChoice: string;
  connections: SavedConnection[];
  method: {
    providerId: string;
  };
  touchedProfileIds: string[];
}): SavedConnection | undefined {
  const touched = params.connections.find((connection) =>
    params.touchedProfileIds.includes(connection.profileId),
  );
  if (touched) {
    return touched;
  }

  return params.connections.find(
    (connection) => connection.providerId === params.method.providerId,
  );
}

function createSingleSecretPrompter(secret: string): WizardPrompterLike {
  let consumedSecret = false;

  return {
    confirm() {
      return Promise.resolve(true);
    },
    intro() {
      return Promise.resolve();
    },
    multiselect() {
      return Promise.reject(
        new Error("This connection method requires an interactive selection flow."),
      );
    },
    note() {
      return Promise.resolve();
    },
    outro() {
      return Promise.resolve();
    },
    progress(label: string) {
      let current = label;
      return {
        stop(message?: string) {
          current = message ?? current;
          void current;
        },
        update(message: string) {
          current = message;
          void current;
        },
      };
    },
    select<T>(params: { options: { value: T }[] }) {
      const first = params.options[0];
      if (!first) {
        return Promise.reject(new Error("No selection options are available."));
      }
      return Promise.resolve(first.value);
    },
    text() {
      if (consumedSecret) {
        return Promise.reject(
          new Error("This connection method requires additional interactive input."),
        );
      }
      consumedSecret = true;
      return Promise.resolve(secret);
    },
  };
}
