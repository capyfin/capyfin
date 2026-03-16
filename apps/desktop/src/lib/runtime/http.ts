function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

let tauriFetchPromise: Promise<typeof fetch> | null = null;
let runtimeFetchInstalled = false;

function resolveRequestUrl(input: Parameters<typeof fetch>[0]): URL | null {
  if (input instanceof URL) {
    return input;
  }

  if (typeof input === "string") {
    try {
      return new URL(input, window.location.href);
    } catch {
      return null;
    }
  }

  if (input instanceof Request) {
    try {
      return new URL(input.url, window.location.href);
    } catch {
      return null;
    }
  }

  return null;
}

async function resolveFetchImplementation(): Promise<typeof fetch> {
  if (!isTauriRuntime()) {
    return fetch;
  }

  tauriFetchPromise ??= import("@tauri-apps/plugin-http").then(
    ({ fetch: tauriFetch }) => tauriFetch as typeof fetch,
  );

  return await tauriFetchPromise;
}

export async function runtimeFetch(
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1],
): Promise<Response> {
  const fetchImplementation = await resolveFetchImplementation();
  return await fetchImplementation(input, init);
}

export function installRuntimeFetch(): void {
  if (runtimeFetchInstalled || !isTauriRuntime()) {
    return;
  }

  const originalFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = (input, init) => {
    const url = resolveRequestUrl(input);
    const method =
      init?.method ??
      (input instanceof Request ? input.method : undefined) ??
      "GET";
    const shouldUseTauriFetch =
      url?.hostname === "127.0.0.1" &&
      url.pathname === "/chat" &&
      method.toUpperCase() === "POST";

    if (!shouldUseTauriFetch) {
      return originalFetch(input, init);
    }

    return runtimeFetch(input, init).catch((error: unknown) => {
      tauriFetchPromise = null;
      return originalFetch(input, init).catch(() => {
        throw error;
      });
    });
  };
  runtimeFetchInstalled = true;
}
