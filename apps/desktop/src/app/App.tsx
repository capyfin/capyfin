import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AppHeader } from "@/app/shell/AppHeader";
import { AppSidebar } from "@/app/shell/AppSidebar";
import type { AppMetadata } from "@/app/types";
import { AllocationCard } from "@/features/dashboard/components/AllocationCard";
import { HoldingsTable } from "@/features/dashboard/components/HoldingsTable";
import { MetricCards } from "@/features/dashboard/components/MetricCards";
import { PortfolioChart } from "@/features/dashboard/components/PortfolioChart";
import { WatchlistCard } from "@/features/dashboard/components/WatchlistCard";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const browserFallback: AppMetadata = {
  productName: "CapyFin",
  workspaceLayout: ["apps/desktop", "docs", "apps/desktop/src-tauri"],
};

export function App() {
  const [metadata, setMetadata] = useState<AppMetadata>(browserFallback);

  useEffect(() => {
    let isMounted = true;

    void invoke<AppMetadata>("app_metadata")
      .then((value) => {
        if (isMounted) {
          setMetadata(value);
        }
      })
      .catch(() => {
        if (isMounted) {
          setMetadata(browserFallback);
        }
      });

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
