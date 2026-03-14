import { MonitorIcon, MoonIcon, PlusIcon, SunIcon } from "lucide-react";
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
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  currentView: "connections" | "chat" | "agents";
  onAddConnection: () => void;
  onCreateAgent: () => void;
}

export function AppHeader({
  currentView,
  onAddConnection,
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
      ? "Connections"
      : currentView === "agents"
        ? "Agents"
        : "Chat";

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
        <Separator
          orientation="vertical"
          className="hidden data-[orientation=vertical]:h-4 sm:block"
        />

        <div className="min-w-0 flex-1">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden text-xs md:block">
                Workspace
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-xs font-medium">
                  {pageTitle}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{today}</p>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {currentView === "connections" ? (
            <Button
              size="sm"
              className="hidden rounded-full px-4 lg:inline-flex"
              onClick={onAddConnection}
            >
              <PlusIcon className="size-3.5" />
              Add connection
            </Button>
          ) : null}

          {currentView === "agents" ? (
            <Button
              size="sm"
              className="hidden rounded-full px-4 lg:inline-flex"
              onClick={onCreateAgent}
            >
              <PlusIcon className="size-3.5" />
              Create Agent
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: "light" as const, icon: SunIcon, label: "Light" },
    { value: "dark" as const, icon: MoonIcon, label: "Dark" },
    { value: "system" as const, icon: MonitorIcon, label: "System" },
  ];

  return (
    <div className="flex items-center rounded-full border border-border bg-secondary p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          title={option.label}
          className={cn(
            "flex size-7 items-center justify-center rounded-full transition-all duration-200",
            theme === option.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => {
            setTheme(option.value);
          }}
        >
          <option.icon className="size-3.5" />
        </button>
      ))}
    </div>
  );
}
