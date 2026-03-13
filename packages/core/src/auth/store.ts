import {
  chmod,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, join } from "node:path";
import { syncAuthBridge } from "./bridge.ts";
import { resolveAuthStoreLocation } from "./paths.ts";
import type {
  ApiKeyProfile,
  AuthProfile,
  AuthStore,
  OAuthProfile,
  TokenProfile,
} from "./types.ts";

const AUTH_STORE_VERSION = 1 as const;

export function createEmptyAuthStore(): AuthStore {
  return {
    version: AUTH_STORE_VERSION,
    profiles: {},
    order: {},
  };
}

export function resolveAuthStorePath(
  env: NodeJS.ProcessEnv = process.env,
): string {
  return resolveAuthStoreLocation(env).authStorePath;
}

export async function loadAuthStore(
  storePath = resolveAuthStorePath(),
): Promise<AuthStore> {
  try {
    const rawContent = await readFile(storePath, "utf8");
    return normalizeAuthStore(JSON.parse(rawContent) as unknown);
  } catch (error) {
    if (isMissingFileError(error)) {
      return createEmptyAuthStore();
    }

    if (error instanceof SyntaxError) {
      throw new Error(
        `Failed to parse auth store at ${storePath}. The file contains invalid JSON.`,
      );
    }

    throw error;
  }
}

export async function saveAuthStore(
  store: AuthStore,
  storePath = resolveAuthStorePath(),
): Promise<void> {
  const directory = dirname(storePath);
  const temporaryPath = join(
    directory,
    `.tmp-${String(process.pid)}-${String(Date.now())}-${Math.random().toString(16).slice(2)}.json`,
  );
  const payload = JSON.stringify(store, null, 2);

  await mkdir(directory, { recursive: true, mode: 0o700 });
  await writeFile(temporaryPath, `${payload}\n`, { mode: 0o600 });
  await chmod(temporaryPath, 0o600);

  try {
    await rename(temporaryPath, storePath);
    await syncAuthBridge(store, storePath);
  } catch (error) {
    await rm(temporaryPath, { force: true });
    throw error;
  }
}

function normalizeAuthStore(raw: unknown): AuthStore {
  if (!raw || typeof raw !== "object") {
    return createEmptyAuthStore();
  }

  const record = raw as Record<string, unknown>;
  const profiles = normalizeProfiles(record.profiles);
  const order = normalizeOrder(record.order, profiles);
  const activeProfileId = normalizeOptionalString(record.activeProfileId);
  const activeProviderId = normalizeActiveProviderId({
    activeProviderId: record.activeProviderId,
    activeProfileId,
    profiles,
  });

  return {
    version: AUTH_STORE_VERSION,
    profiles,
    order,
    ...(activeProfileId && profiles[activeProfileId]
      ? { activeProfileId }
      : {}),
    ...(activeProviderId ? { activeProviderId } : {}),
  };
}

function normalizeProfiles(raw: unknown): Record<string, AuthProfile> {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const profiles: Record<string, AuthProfile> = {};

  for (const [profileId, value] of Object.entries(raw as Record<string, unknown>)) {
    const profile = normalizeProfile(value);

    if (profile) {
      profiles[profileId] = profile;
    }
  }

  return profiles;
}

function normalizeProfile(raw: unknown): AuthProfile | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const type = normalizeOptionalString(record.type);
  const provider = normalizeOptionalString(record.provider);
  const label = normalizeOptionalString(record.label) ?? "default";
  const createdAt = normalizeOptionalString(record.createdAt) ?? new Date(0).toISOString();
  const updatedAt = normalizeOptionalString(record.updatedAt) ?? createdAt;

  if (!provider || !type) {
    return null;
  }

  if (type === "api_key") {
    const key = normalizeOptionalString(record.key);
    if (!key) {
      return null;
    }

    const profile: ApiKeyProfile = {
      type,
      provider,
      label,
      key,
      createdAt,
      updatedAt,
    };
    return profile;
  }

  if (type === "token") {
    const token = normalizeOptionalString(record.token);
    if (!token) {
      return null;
    }

    const profile: TokenProfile = {
      type,
      provider,
      label,
      token,
      createdAt,
      updatedAt,
    };
    return profile;
  }

  if (type === "oauth") {
    const credentials = normalizeOAuthCredentials(record.credentials);
    if (!credentials) {
      return null;
    }

    const profile: OAuthProfile = {
      type,
      provider,
      label,
      credentials,
      createdAt,
      updatedAt,
    };
    return profile;
  }

  return null;
}

function normalizeOAuthCredentials(raw: unknown): OAuthProfile["credentials"] | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const credentials = raw as Record<string, unknown>;
  const access = normalizeOptionalString(credentials.access);
  const expires = normalizeOptionalNumber(credentials.expires);
  const refresh = normalizeOptionalString(credentials.refresh);

  if (!access || !refresh || expires === undefined) {
    return null;
  }

  return {
    access,
    expires,
    refresh,
  };
}

function normalizeOrder(
  raw: unknown,
  profiles: Record<string, AuthProfile>,
): Record<string, string[]> {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const order: Record<string, string[]> = {};

  for (const [providerId, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(value)) {
      continue;
    }

    const orderedProfileIds = value.filter(
      (profileId): profileId is string => {
        if (typeof profileId !== "string") {
          return false;
        }

        const profile = profiles[profileId];
        return profile?.provider === providerId;
      },
    );

    if (orderedProfileIds.length > 0) {
      order[providerId] = orderedProfileIds;
    }
  }

  for (const [profileId, profile] of Object.entries(profiles)) {
    const providerOrder = order[profile.provider] ?? [];

    if (!providerOrder.includes(profileId)) {
      providerOrder.push(profileId);
    }

    order[profile.provider] = providerOrder;
  }

  return order;
}

function normalizeActiveProviderId(params: {
  activeProviderId: unknown;
  activeProfileId: string | undefined;
  profiles: Record<string, AuthProfile>;
}): string | undefined {
  const explicitProviderId = normalizeOptionalString(params.activeProviderId);
  if (explicitProviderId) {
    return explicitProviderId;
  }

  if (params.activeProfileId) {
    const activeProfile = params.profiles[params.activeProfileId];
    if (activeProfile) {
      return activeProfile.provider;
    }
  }

  return undefined;
}

function normalizeOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function normalizeOptionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
