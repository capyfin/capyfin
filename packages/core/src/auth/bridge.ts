import { chmod, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { AuthStore } from "./types.ts";

const AUTH_BRIDGE_FILE_NAME = "auth.json";

type BridgeCredential =
  | {
      type: "api_key";
      key: string;
    }
  | ({
      type: "oauth";
    } & Record<string, unknown>);

export function resolveAuthBridgePath(storePath: string): string {
  return join(dirname(storePath), AUTH_BRIDGE_FILE_NAME);
}

export async function loadAuthBridge(
  storePath: string,
): Promise<Record<string, BridgeCredential>> {
  try {
    const rawContent = await readFile(resolveAuthBridgePath(storePath), "utf8");
    const parsed = JSON.parse(rawContent) as unknown;

    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    return parsed as Record<string, BridgeCredential>;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "ENOENT"
    ) {
      return {};
    }

    throw error;
  }
}

export async function syncAuthBridge(
  store: AuthStore,
  storePath: string,
): Promise<void> {
  const bridgePath = resolveAuthBridgePath(storePath);
  const directory = dirname(bridgePath);
  const payload = buildBridgePayload(store);

  await mkdir(directory, { recursive: true, mode: 0o700 });

  if (Object.keys(payload).length === 0) {
    await rm(bridgePath, { force: true });
    return;
  }

  const temporaryPath = join(
    directory,
    `.tmp-${String(process.pid)}-${String(Date.now())}-${Math.random().toString(16).slice(2)}.json`,
  );

  await writeFile(temporaryPath, `${JSON.stringify(payload, null, 2)}\n`, {
    mode: 0o600,
  });
  await chmod(temporaryPath, 0o600);

  try {
    await rename(temporaryPath, bridgePath);
  } catch (error) {
    await rm(temporaryPath, { force: true });
    throw error;
  }
}

function buildBridgePayload(
  store: AuthStore,
): Record<string, BridgeCredential> {
  const credentials: Record<string, BridgeCredential> = {};

  for (const profileId of orderedProfileIds(store)) {
    const profile = store.profiles[profileId];
    if (!profile || credentials[profile.provider]) {
      continue;
    }

    const bridgeCredential = toBridgeCredential(profile);
    if (!bridgeCredential) {
      continue;
    }

    credentials[profile.provider] = bridgeCredential;
  }

  return credentials;
}

function orderedProfileIds(store: AuthStore): string[] {
  const profileIds = new Set<string>();

  if (store.activeProfileId && store.profiles[store.activeProfileId]) {
    profileIds.add(store.activeProfileId);
  }

  for (const providerOrder of Object.values(store.order)) {
    for (const profileId of providerOrder) {
      if (store.profiles[profileId]) {
        profileIds.add(profileId);
      }
    }
  }

  for (const profileId of Object.keys(store.profiles)) {
    profileIds.add(profileId);
  }

  return [...profileIds];
}

function toBridgeCredential(
  profile: AuthStore["profiles"][string],
): BridgeCredential | null {
  if (profile.type === "api_key") {
    const key = profile.key.trim();
    return key ? { type: "api_key", key } : null;
  }

  if (profile.type === "token") {
    const key = profile.token.trim();
    return key ? { type: "api_key", key } : null;
  }

  if (
    !profile.credentials.access.trim() ||
    !profile.credentials.refresh.trim() ||
    !Number.isFinite(profile.credentials.expires)
  ) {
    return null;
  }

  return {
    type: "oauth",
    ...profile.credentials,
  };
}
