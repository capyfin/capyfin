import { PlusIcon } from "lucide-react";
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
  currentView: "connections" | "chat" | "agents";
  onCreateAgent: () => void;
}

export function AppHeader({
  currentView,
  onCreateAgent,
}: AppHeaderProps) {
  const today = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    weekday: "long",
    year: "numeric",
  }).format(new Date());
  const pageTitle =
    currentView === "connections"
      ? "Provider Setup"
      : currentView === "agents"
        ? "Agents"
        : "Chat";

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
              <BreadcrumbItem>
                <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <p className="mt-1 text-xs text-muted-foreground">{today}</p>
        </div>

        {currentView === "agents" ? (
          <div className="hidden items-center gap-2 lg:flex">
            <Button
              size="sm"
              className="rounded-full px-4"
              onClick={onCreateAgent}
            >
              <PlusIcon className="size-4" />
              Create Agent
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
