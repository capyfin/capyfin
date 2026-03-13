import { appManifest, type AppManifest, type AuthOverview } from "@capyfin/contracts";
import { Channel, invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { AppHeader } from "@/app/shell/AppHeader";
import { AppSidebar } from "@/app/shell/AppSidebar";
import { AllocationCard } from "@/features/dashboard/components/AllocationCard";
import { HoldingsTable } from "@/features/dashboard/components/HoldingsTable";
import { MetricCards } from "@/features/dashboard/components/MetricCards";
import { PortfolioChart } from "@/features/dashboard/components/PortfolioChart";
import { WatchlistCard } from "@/features/dashboard/components/WatchlistCard";
import { ConnectionCenter } from "@/features/onboarding/components/ConnectionCenter";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SidecarClient } from "@/lib/sidecar/client";
import type { AppMetadata, SidecarConnection } from "@/app/types";

type InitStep = "sidecar_waiting" | "sidecar_ready" | "done";
type AppView = "connections" | "overview";

const browserFallback: AppMetadata = appManifest;

export function App() {
  const [metadata, setMetadata] = useState<AppManifest>(browserFallback);
  const [authOverview, setAuthOverview] = useState<AuthOverview | null>(null);
  const [client, setClient] = useState<SidecarClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [hashView, setHashView] = useState<AppView>(readViewFromHash());

  useEffect(() => {
    let isMounted = true;

    async function hydrateFromSidecar(): Promise<void> {
      try {
        const connection = await invoke<SidecarConnection>(
          "await_initialization",
          {
            events: new Channel<InitStep>(),
          },
        );
        const client = SidecarClient.fromConnection(connection);
        await client.waitUntilHealthy();
        const [bootstrap, overview] = await Promise.all([
          client.bootstrap(),
          client.authOverview(),
        ]);

        if (isMounted) {
          setAuthOverview(overview);
          setClient(client);
          setMetadata(bootstrap.manifest);
          setRuntimeError(null);
        }
      } catch (error) {
        if (isMounted) {
          setMetadata(browserFallback);
          setRuntimeError(
            error instanceof Error
              ? error.message
              : "The local sidecar is unavailable.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void hydrateFromSidecar();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const onHashChange = (): void => {
      setHashView(readViewFromHash());
    };

    window.addEventListener("hashchange", onHashChange);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  const currentView: AppView = authOverview?.selectedProviderId
    ? hashView
    : "connections";

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar activeView={currentView} authOverview={authOverview} />
      <SidebarInset className="bg-transparent">
        <AppHeader
          authOverview={authOverview}
          currentView={currentView}
          metadata={metadata}
        />
        <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
          {currentView === "connections" ? (
            <ConnectionCenter
              authOverview={authOverview}
              client={client}
              isLoading={isLoading}
              runtimeError={runtimeError}
              onAuthOverviewChange={setAuthOverview}
              onContinue={() => {
                window.location.hash = "#overview";
              }}
            />
          ) : (
            <>
              <MetricCards />
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
                <PortfolioChart />
                <AllocationCard metadata={metadata} />
              </div>
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.9fr)]">
                <HoldingsTable />
                <WatchlistCard />
              </div>
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function readViewFromHash(): AppView {
  return window.location.hash === "#connections" ? "connections" : "overview";
}
