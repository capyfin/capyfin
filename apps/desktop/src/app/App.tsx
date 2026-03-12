import { appManifest, type AppManifest } from "@capyfin/contracts";
import { Channel, invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { AppHeader } from "@/app/shell/AppHeader";
import { AppSidebar } from "@/app/shell/AppSidebar";
import { AllocationCard } from "@/features/dashboard/components/AllocationCard";
import { HoldingsTable } from "@/features/dashboard/components/HoldingsTable";
import { MetricCards } from "@/features/dashboard/components/MetricCards";
import { PortfolioChart } from "@/features/dashboard/components/PortfolioChart";
import { WatchlistCard } from "@/features/dashboard/components/WatchlistCard";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SidecarClient } from "@/lib/sidecar/client";
import type { AppMetadata, SidecarConnection } from "@/app/types";

type InitStep = "sidecar_waiting" | "sidecar_ready" | "done";

const browserFallback: AppMetadata = appManifest;

export function App() {
  const [metadata, setMetadata] = useState<AppManifest>(browserFallback);

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
        const bootstrap = await client.bootstrap();

        if (isMounted) {
          setMetadata(bootstrap.manifest);
        }
      } catch {
        if (isMounted) {
          setMetadata(browserFallback);
        }
      }
    }

    void hydrateFromSidecar();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="bg-transparent">
        <AppHeader metadata={metadata} />
        <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
          <MetricCards />
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
            <PortfolioChart />
            <AllocationCard metadata={metadata} />
          </div>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.9fr)]">
            <HoldingsTable />
            <WatchlistCard />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
