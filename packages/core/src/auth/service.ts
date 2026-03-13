import { getEnvApiKey } from "@mariozechner/pi-ai";
import {
  getOAuthApiKey,
  getOAuthProvider,
  registerOAuthProvider,
  type OAuthLoginCallbacks,
} from "@mariozechner/pi-ai/oauth";
import { getProviderDefinition, listProviderDefinitions } from "./providers.ts";
import { createOpenAICodexOAuthProvider } from "./oauth/openai-codex-provider.ts";
import { resolveAuthStoreLocation } from "./paths.ts";
import {
  createEmptyAuthStore,
  loadAuthStore,
  saveAuthStore,
} from "./store.ts";
import type {
  AuthOverview,
  AuthProfile,
  AuthServiceOptions,
  AuthStore,
  ProviderDefinition,
  ProviderStatus,
  ResolvedProviderCredential,
  SaveOAuthProfileParams,
  SaveSecretProfileParams,
  StoredProfileSummary,
  StoredCredentialType,
} from "./types.ts";

registerOAuthProvider(createOpenAICodexOAuthProvider());

export class ProviderAuthService {
  readonly #env: NodeJS.ProcessEnv;
  readonly #now: () => Date;
  readonly #storePath: string;

  constructor(options: AuthServiceOptions = {}) {
    this.#env = options.env ?? process.env;
    this.#now = options.now ?? (() => new Date());
    this.#storePath =
      options.storePath ?? resolveAuthStoreLocation(this.#env).authStorePath;
  }

  getStorePath(): string {
    return this.#storePath;
  }

  listProviders(): ProviderDefinition[] {
    return listProviderDefinitions();
  }

  async getOverview(): Promise<AuthOverview> {
    const store = await this.#readStore();

    return {
      storePath: this.#storePath,
      ...(store.activeProviderId
        ? { selectedProviderId: store.activeProviderId }
        : {}),
      ...(store.activeProfileId
        ? { selectedProfileId: store.activeProfileId }
        : {}),
      providers: this.listProviders().map((provider) =>
        this.#buildProviderStatus(provider, store),
      ),
    };
  }

  async getProviderStatus(providerId: string): Promise<ProviderStatus> {
    const provider = this.#requireProvider(providerId);
    const store = await this.#readStore();
    return this.#buildProviderStatus(provider, store);
  }

  async saveSecretProfile(
    params: SaveSecretProfileParams,
  ): Promise<StoredProfileSummary> {
    const provider = this.#requireProvider(params.providerId);
    const secret = params.secret.trim();

    if (!secret) {
      throw new Error("Credential value cannot be empty.");
    }

    const storedCredentialType = provider.secretType;
    if (!storedCredentialType) {
      throw new Error(
        `${provider.name} does not support storing a static secret profile.`,
      );
    }

    const store = await this.#readStore();
    const profileId = createProfileId(
      params.providerId,
      params.label ?? "default",
    );
    const timestamp = this.#now().toISOString();
    const existingProfile = store.profiles[profileId];
    const createdAt = existingProfile?.createdAt ?? timestamp;

    const profile = createStoredSecretProfile({
      createdAt,
      label: extractProfileLabel(profileId, params.providerId),
      providerId: params.providerId,
      secret,
      storedCredentialType,
      updatedAt: timestamp,
    });

    store.profiles[profileId] = profile;
    store.order[params.providerId] = upsertProfileOrder(
      store.order[params.providerId],
      profileId,
    );

    if (params.activate ?? true) {
      this.#applyActiveSelection(store, params.providerId, profileId);
    }

    await this.#writeStore(store);
    return this.#buildProfileSummary(profileId, profile, store);
  }

  async saveOAuthProfile(
    params: SaveOAuthProfileParams,
  ): Promise<StoredProfileSummary> {
    const provider = this.#requireProvider(params.providerId);

    if (!provider.authMethods.includes("oauth")) {
      throw new Error(`${provider.name} does not expose an OAuth login flow.`);
    }

    const store = await this.#readStore();
    const profileId = createProfileId(
      params.providerId,
      params.label ?? "default",
    );
    const timestamp = this.#now().toISOString();
    const existingProfile = store.profiles[profileId];

    store.profiles[profileId] = {
      type: "oauth",
      provider: params.providerId,
      label: extractProfileLabel(profileId, params.providerId),
      credentials: params.credentials,
      createdAt: existingProfile?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };
    store.order[params.providerId] = upsertProfileOrder(
      store.order[params.providerId],
      profileId,
    );

    if (params.activate ?? true) {
      this.#applyActiveSelection(store, params.providerId, profileId);
    }

    await this.#writeStore(store);
    return this.#buildProfileSummary(profileId, store.profiles[profileId], store);
  }

  async loginWithOAuth(params: {
    providerId: string;
    label?: string | undefined;
    activate?: boolean | undefined;
    callbacks: OAuthLoginCallbacks;
  }): Promise<StoredProfileSummary> {
    const provider = this.#requireProvider(params.providerId);
    const oauthProvider = getOAuthProvider(
      provider.oauthProviderId ?? params.providerId,
    );

    if (!oauthProvider) {
      throw new Error(`${provider.name} does not expose an OAuth login flow.`);
    }

    const credentials = await oauthProvider.login(params.callbacks);
    return this.saveOAuthProfile({
      ...(params.activate !== undefined ? { activate: params.activate } : {}),
      credentials,
      ...(params.label ? { label: params.label } : {}),
      providerId: params.providerId,
    });
  }

  async selectProvider(selector: string): Promise<ProviderStatus> {
    const store = await this.#readStore();
    const directProfile = store.profiles[selector];

    if (directProfile) {
      this.#applyActiveSelection(store, directProfile.provider, selector);
      await this.#writeStore(store);
      return this.#buildProviderStatus(
        this.#requireProvider(directProfile.provider),
        store,
      );
    }

    const provider = this.#requireProvider(selector);
    const orderedProfiles = this.#getOrderedProfiles(store, provider.id);
    const hasEnvironmentAuth = this.#resolveEnvironmentCredential(provider) !== null;

    if (orderedProfiles[0]) {
      this.#applyActiveSelection(store, provider.id, orderedProfiles[0].profileId);
    } else if (hasEnvironmentAuth) {
      store.activeProviderId = provider.id;
      delete store.activeProfileId;
    } else {
      throw new Error(
        `${provider.name} has no stored profile or environment credentials to select.`,
      );
    }

    await this.#writeStore(store);
    return this.#buildProviderStatus(provider, store);
  }

  async resolveCredential(
    providerId?: string,
  ): Promise<ResolvedProviderCredential | null> {
    let store = await this.#readStore();
    const selectedProviderId = providerId ?? store.activeProviderId;

    if (!selectedProviderId) {
      return null;
    }

    const provider = this.#requireProvider(selectedProviderId);
    const profileSummary = this.#getOrderedProfiles(store, selectedProviderId)[0];

    if (store.activeProfileId) {
      const activeProfile = store.profiles[store.activeProfileId];
      if (activeProfile?.provider === selectedProviderId) {
        const resolvedActive = await this.#resolveStoredProfileCredential(
          store,
          store.activeProfileId,
          activeProfile,
        );
        store = resolvedActive.store;
        return resolvedActive.credential;
      }
    }

    if (profileSummary) {
      const profile = store.profiles[profileSummary.profileId];
      if (!profile) {
        return this.#resolveEnvironmentCredential(provider);
      }

      const resolvedProfile = await this.#resolveStoredProfileCredential(
        store,
        profileSummary.profileId,
        profile,
      );
      return resolvedProfile.credential;
    }

    return this.#resolveEnvironmentCredential(provider);
  }

  #applyActiveSelection(
    store: AuthStore,
    providerId: string,
    profileId: string | undefined,
  ): void {
    store.activeProviderId = providerId;
    if (profileId) {
      store.activeProfileId = profileId;
      return;
    }

    delete store.activeProfileId;
  }

  #buildProviderStatus(
    provider: ProviderDefinition,
    store: AuthStore,
  ): ProviderStatus {
    const profiles = this.#getOrderedProfiles(store, provider.id);
    const environment = this.#resolveEnvironmentStatus(provider);
    let resolved = profiles[0]
      ? {
          description: `Stored profile ${profiles[0].profileId}`,
          method: profiles[0].type,
          profileId: profiles[0].profileId,
          source: "profile" as const,
        }
      : environment.available && environment.method && environment.sourceLabel
        ? {
            description: environment.sourceLabel,
            method: environment.method,
            source: "environment" as const,
          }
        : undefined;

    if (store.activeProfileId) {
      const activeProfile = store.profiles[store.activeProfileId];
      if (activeProfile?.provider === provider.id) {
        resolved = {
          description: `Selected profile ${store.activeProfileId}`,
          method: activeProfile.type,
          profileId: store.activeProfileId,
          source: "profile",
        };
      }
    } else if (
      store.activeProviderId === provider.id &&
      environment.available &&
      environment.method &&
      environment.sourceLabel
    ) {
      resolved = {
        description: environment.sourceLabel,
        method: environment.method,
        source: "environment",
      };
    }

    const selectedProfile =
      store.activeProfileId !== undefined
        ? store.profiles[store.activeProfileId]
        : undefined;

    return {
      provider,
      environment,
      isSelectedProfileProvider: selectedProfile?.provider === provider.id,
      isSelectedProvider: store.activeProviderId === provider.id,
      profiles,
      ...(resolved ? { resolved } : {}),
      ...(store.activeProfileId &&
      selectedProfile?.provider === provider.id
        ? { selectedProfileId: store.activeProfileId }
        : {}),
    };
  }

  #buildProfileSummary(
    profileId: string,
    profile: AuthProfile,
    store: AuthStore,
  ): StoredProfileSummary {
    return {
      profileId,
      providerId: profile.provider,
      label: profile.label,
      type: profile.type,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      isActiveProfile: store.activeProfileId === profileId,
    };
  }

  #getOrderedProfiles(
    store: AuthStore,
    providerId: string,
  ): StoredProfileSummary[] {
    const orderedProfileIds = store.order[providerId] ?? [];
    const seen = new Set<string>();
    const summaries: StoredProfileSummary[] = [];

    for (const profileId of orderedProfileIds) {
      const profile = store.profiles[profileId];
      if (profile?.provider !== providerId || seen.has(profileId)) {
        continue;
      }

      seen.add(profileId);
      summaries.push(this.#buildProfileSummary(profileId, profile, store));
    }

    for (const [profileId, profile] of Object.entries(store.profiles)) {
      if (profile.provider !== providerId || seen.has(profileId)) {
        continue;
      }

      seen.add(profileId);
      summaries.push(this.#buildProfileSummary(profileId, profile, store));
    }

    return summaries;
  }

  #readStore(): Promise<AuthStore> {
    return loadAuthStore(this.#storePath);
  }

  async #resolveStoredProfileCredential(
    store: AuthStore,
    profileId: string,
    profile: AuthProfile,
  ): Promise<{
    credential: ResolvedProviderCredential;
    store: AuthStore;
  }> {
    if (profile.type !== "oauth") {
      return {
        credential: toResolvedProfileCredential(profileId, profile),
        store,
      };
    }

    const oauthResult = await getOAuthApiKey(profile.provider, {
      [profile.provider]: profile.credentials,
    });

    if (!oauthResult) {
      throw new Error(`No OAuth credentials found for ${profile.provider}.`);
    }

    const nextProfile: AuthProfile = {
      ...profile,
      credentials: oauthResult.newCredentials,
      updatedAt: this.#now().toISOString(),
    };
    const nextStore: AuthStore = {
      ...store,
      profiles: {
        ...store.profiles,
        [profileId]: nextProfile,
      },
    };

    if (
      nextProfile.credentials.access !== profile.credentials.access ||
      nextProfile.credentials.refresh !== profile.credentials.refresh ||
      nextProfile.credentials.expires !== profile.credentials.expires
    ) {
      await this.#writeStore(nextStore);
    }

    return {
      credential: toResolvedProfileCredential(profileId, nextProfile),
      store: nextStore,
    };
  }

  #resolveEnvironmentCredential(
    provider: ProviderDefinition,
  ): ResolvedProviderCredential | null {
    const environment = this.#resolveEnvironmentStatus(provider);
    if (!environment.available || !environment.method || !environment.sourceLabel) {
      return null;
    }

    const secret = resolveEnvironmentSecret(provider.id, this.#env);

    return {
      providerId: provider.id,
      method: environment.method,
      source: "environment",
      sourceLabel: environment.sourceLabel,
      ...(secret ? { secret } : {}),
    };
  }

  #resolveEnvironmentStatus(
    provider: ProviderDefinition,
  ): ProviderStatus["environment"] {
    const matchedEnvVar = provider.envVars.find((envVar) =>
      hasEnvironmentValue(this.#env[envVar]),
    );

    if (matchedEnvVar) {
      const method = matchedEnvVar.includes("TOKEN") ? "token" : "api_key";
      return {
        available: true,
        envVars: provider.envVars,
        method,
        sourceLabel: `Environment variable ${matchedEnvVar}`,
      };
    }

    if (
      provider.id === "amazon-bedrock" &&
      (hasAwsSdkEnvironmentCredentials(this.#env) ||
        (this.#env === process.env &&
          getEnvApiKey("amazon-bedrock") === "<authenticated>"))
    ) {
      return {
        available: true,
        envVars: provider.envVars,
        method: "aws_sdk",
        sourceLabel: "AWS SDK credential chain",
      };
    }

    if (
      provider.id === "google-vertex" &&
      (hasVertexApplicationDefaultCredentials(this.#env) ||
        (this.#env === process.env &&
          getEnvApiKey("google-vertex") === "<authenticated>"))
    ) {
      return {
        available: true,
        envVars: provider.envVars,
        method: "application_default",
        sourceLabel: "Google Application Default Credentials",
      };
    }

    return {
      available: false,
      envVars: provider.envVars,
    };
  }

  async #writeStore(store: AuthStore): Promise<void> {
    await saveAuthStore(store, this.#storePath);
  }

  #requireProvider(providerId: string): ProviderDefinition {
    const provider = getProviderDefinition(providerId);

    if (!provider) {
      throw new Error(`Unknown provider: ${providerId}`);
    }

    return provider;
  }
}

function createStoredSecretProfile(params: {
  providerId: string;
  label: string;
  storedCredentialType: StoredCredentialType;
  secret: string;
  createdAt: string;
  updatedAt: string;
}): AuthProfile {
  if (params.storedCredentialType === "token") {
    return {
      type: "token",
      provider: params.providerId,
      label: params.label,
      token: params.secret,
      createdAt: params.createdAt,
      updatedAt: params.updatedAt,
    };
  }

  return {
    type: "api_key",
    provider: params.providerId,
    label: params.label,
    key: params.secret,
    createdAt: params.createdAt,
    updatedAt: params.updatedAt,
  };
}

function createProfileId(providerId: string, label: string): string {
  const normalizedLabel = slugifyLabel(label) || "default";
  return `${providerId}:${normalizedLabel}`;
}

function extractProfileLabel(profileId: string, providerId: string): string {
  const prefix = `${providerId}:`;
  return profileId.startsWith(prefix) ? profileId.slice(prefix.length) : "default";
}

function hasAwsSdkEnvironmentCredentials(env: NodeJS.ProcessEnv): boolean {
  return (
    hasEnvironmentValue(env.AWS_BEARER_TOKEN_BEDROCK) ||
    (hasEnvironmentValue(env.AWS_ACCESS_KEY_ID) &&
      hasEnvironmentValue(env.AWS_SECRET_ACCESS_KEY)) ||
    hasEnvironmentValue(env.AWS_PROFILE) ||
    hasEnvironmentValue(env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI) ||
    hasEnvironmentValue(env.AWS_CONTAINER_CREDENTIALS_FULL_URI) ||
    hasEnvironmentValue(env.AWS_WEB_IDENTITY_TOKEN_FILE)
  );
}

function hasEnvironmentValue(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function hasVertexApplicationDefaultCredentials(
  env: NodeJS.ProcessEnv,
): boolean {
  const hasProject =
    hasEnvironmentValue(env.GOOGLE_CLOUD_PROJECT) ||
    hasEnvironmentValue(env.GCLOUD_PROJECT);
  const hasLocation = hasEnvironmentValue(env.GOOGLE_CLOUD_LOCATION);
  const hasCredentialMarker = hasEnvironmentValue(env.GOOGLE_APPLICATION_CREDENTIALS);

  return hasProject && hasLocation && hasCredentialMarker;
}

function resolveEnvironmentSecret(
  providerId: string,
  env: NodeJS.ProcessEnv,
): string | undefined {
  switch (providerId) {
    case "anthropic":
      return env.ANTHROPIC_OAUTH_TOKEN ?? env.ANTHROPIC_API_KEY;
    case "openai":
      return env.OPENAI_API_KEY;
    case "google":
      return env.GEMINI_API_KEY;
    case "google-vertex":
      return env.GOOGLE_CLOUD_API_KEY;
    case "mistral":
      return env.MISTRAL_API_KEY;
    case "groq":
      return env.GROQ_API_KEY;
    case "xai":
      return env.XAI_API_KEY;
    case "openrouter":
      return env.OPENROUTER_API_KEY;
    case "cerebras":
      return env.CEREBRAS_API_KEY;
    case "huggingface":
      return env.HF_TOKEN;
    case "github-copilot":
      return env.COPILOT_GITHUB_TOKEN ?? env.GH_TOKEN ?? env.GITHUB_TOKEN;
    case "azure-openai-responses":
      return env.AZURE_OPENAI_API_KEY;
    case "vercel-ai-gateway":
      return env.AI_GATEWAY_API_KEY;
    case "zai":
      return env.ZAI_API_KEY;
    default:
      return undefined;
  }
}

function slugifyLabel(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toResolvedProfileCredential(
  profileId: string,
  profile: AuthProfile,
): ResolvedProviderCredential {
  if (profile.type === "oauth") {
    return {
      providerId: profile.provider,
      method: profile.type,
      source: "profile",
      sourceLabel: `Stored profile ${profileId}`,
      profileId,
      credentials: profile.credentials,
      secret: profile.credentials.access,
    };
  }

  return {
    providerId: profile.provider,
    method: profile.type,
    source: "profile",
    sourceLabel: `Stored profile ${profileId}`,
    profileId,
    secret: profile.type === "api_key" ? profile.key : profile.token,
  };
}

function upsertProfileOrder(
  existingOrder: string[] | undefined,
  profileId: string,
): string[] {
  const nextOrder = (existingOrder ?? []).filter((existingId) => existingId !== profileId);
  nextOrder.unshift(profileId);
  return nextOrder;
}

export async function loadOrCreateAuthStore(
  options: Pick<AuthServiceOptions, "storePath"> = {},
): Promise<AuthStore> {
  return loadAuthStore(options.storePath);
}

export async function resetAuthStore(
  options: Pick<AuthServiceOptions, "storePath"> = {},
): Promise<void> {
  await saveAuthStore(createEmptyAuthStore(), options.storePath);
}
