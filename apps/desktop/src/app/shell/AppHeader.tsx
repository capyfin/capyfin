import { Link2Icon, RefreshCcwIcon, ShieldCheckIcon } from "lucide-react";
import type { AppMetadata, AuthOverview } from "@/app/types";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface AppHeaderProps {
  authOverview: AuthOverview | null;
  currentView: "connections" | "overview";
  metadata: AppMetadata;
}

export function AppHeader({
  authOverview,
  currentView,
  metadata,
}: AppHeaderProps) {
  const today = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    weekday: "long",
    year: "numeric",
  }).format(new Date());
  const connectedProviderCount =
    authOverview?.providers.filter(
      (provider) =>
        provider.profiles.length > 0 || provider.environment.available,
    ).length ?? 0;
  const pageTitle =
    currentView === "connections" ? "Provider Setup" : "Agents";

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="hidden data-[orientation=vertical]:h-5 sm:block"
        />

        <div className="min-w-0 flex-1">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                Workspace
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden sm:block">
                Portfolio
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden sm:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <p className="mt-1 text-xs text-muted-foreground">{today}</p>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <div className="flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
            <ShieldCheckIcon className="size-3.5 text-emerald-600" />
            {connectedProviderCount > 0
              ? `${String(connectedProviderCount)} providers ready`
              : `${String(metadata.workspaceLayout.length)} workspaces ready`}
          </div>
          <Button size="sm" className="rounded-full px-4" asChild>
            <a href={currentView === "connections" ? "#overview" : "#connections"}>
              {currentView === "connections" ? (
                <RefreshCcwIcon className="size-4" />
              ) : (
                <Link2Icon className="size-4" />
              )}
              {currentView === "connections"
                ? "Open workspace"
                : "Manage providers"}
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
