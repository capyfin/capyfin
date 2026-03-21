import { useEffect, useState } from "react";
import type { SidecarClient } from "@/lib/sidecar/client";

/**
 * Returns whether the FMP data provider is connected.
 * Defaults to `false` while loading or when the client is unavailable.
 */
export function useFmpConnected(client: SidecarClient | null): boolean {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!client) return;

    let cancelled = false;
    const runtimeClient = client;

    async function check(): Promise<void> {
      try {
        const overview = await runtimeClient.getDataProviders();
        if (!cancelled) {
          const fmp = overview.providers.find((p) => p.id === "fmp");
          setConnected(fmp?.connected ?? false);
        }
      } catch {
        // If we can't reach the sidecar, assume Tier 0
        if (!cancelled) setConnected(false);
      }
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, [client]);

  return connected;
}
