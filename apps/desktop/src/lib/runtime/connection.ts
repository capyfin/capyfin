import {
  sidecarConnectionSchema,
  type SidecarConnection,
} from "@capyfin/contracts";
import { isTauriRuntime } from "@/lib/platform/runtime";

const DEV_DEFAULT_USERNAME = "capyfin";
const DEV_DEFAULT_PASSWORD = "capyfin-dev-password";

type InitStep = "sidecar_waiting" | "sidecar_ready" | "done";

interface BrowserDevEnv {
  DEV: boolean;
  VITE_CAPYFIN_BROWSER_SIDECAR_PASSWORD?: string;
  VITE_CAPYFIN_BROWSER_SIDECAR_URL?: string;
  VITE_CAPYFIN_BROWSER_SIDECAR_USERNAME?: string;
}

export function resolveBrowserDevConnection(
  env: BrowserDevEnv,
  tauriRuntime: boolean,
): SidecarConnection | null {
  if (!env.DEV || tauriRuntime) {
    return null;
  }

  const url = env.VITE_CAPYFIN_BROWSER_SIDECAR_URL?.trim();
  const username = env.VITE_CAPYFIN_BROWSER_SIDECAR_USERNAME?.trim();
  const password = env.VITE_CAPYFIN_BROWSER_SIDECAR_PASSWORD?.trim();

  const connection = {
    isSidecar: true,
    password: password && password.length > 0 ? password : DEV_DEFAULT_PASSWORD,
    url:
      url && url.length > 0
        ? url
        : typeof window !== "undefined"
          ? window.location.origin
          : "http://127.0.0.1:1510",
    username: username && username.length > 0 ? username : DEV_DEFAULT_USERNAME,
  };

  return sidecarConnectionSchema.parse(connection);
}

function readBrowserDevConnection(): SidecarConnection | null {
  return resolveBrowserDevConnection(import.meta.env, isTauriRuntime());
}

async function awaitTauriConnection(): Promise<SidecarConnection> {
  const [{ Channel, invoke }] = await Promise.all([
    import("@tauri-apps/api/core"),
  ]);

  return sidecarConnectionSchema.parse(
    await invoke<SidecarConnection>("await_initialization", {
      events: new Channel<InitStep>(),
    }),
  );
}

export async function initializeSidecarConnection(): Promise<SidecarConnection> {
  const browserConnection = readBrowserDevConnection();
  if (browserConnection) {
    return browserConnection;
  }

  return await awaitTauriConnection();
}
