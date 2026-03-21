import { useEffect, useState } from "react";
import { LoaderCircleIcon } from "lucide-react";
import type { DataProviderStatus } from "@/app/types";
import { SidecarClient } from "@/lib/sidecar/client";
import { getErrorMessage } from "@/lib/utils";
import { DataProviderRow } from "./DataProviderRow";

interface FinancialDataSectionProps {
  client: SidecarClient | null;
}

export function FinancialDataSection({ client }: FinancialDataSectionProps) {
  const [providers, setProviders] = useState<DataProviderStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const runtimeClient = client;

    async function load(): Promise<void> {
      try {
        const overview = await runtimeClient.getDataProviders();
        if (!cancelled) {
          setProviders(overview.providers);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [client]);

  async function handleSaveKey(
    providerId: string,
    apiKey: string,
  ): Promise<void> {
    if (!client) return;
    const updated = await client.saveDataProviderKey(providerId, apiKey);
    setProviders((current) =>
      current.map((p) => (p.id === updated.id ? updated : p)),
    );
  }

  async function handleDeleteKey(providerId: string): Promise<void> {
    if (!client) return;
    await client.deleteDataProviderKey(providerId);
    setProviders((current) =>
      current.map((p) =>
        p.id === providerId
          ? { ...p, connected: false, connectedAt: undefined }
          : p,
      ),
    );
  }

  return (
    <section data-testid="financial-data-section">
      <div className="mb-3">
        <h2 className="text-[14px] font-semibold text-foreground">
          Financial Data
        </h2>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          Connect data providers for richer analysis. None are required — all
          skills work without them.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <LoaderCircleIcon className="size-4 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-warning/20 bg-warning/8 px-3.5 py-2.5 text-[13px] text-warning-foreground">
          {error}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {providers.map((provider) => (
            <DataProviderRow
              key={provider.id}
              provider={provider}
              onSaveKey={handleSaveKey}
              onDeleteKey={handleDeleteKey}
            />
          ))}
        </div>
      )}
    </section>
  );
}
