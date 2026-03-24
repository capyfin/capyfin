import type { LucideIcon } from "lucide-react";
import {
  MonitorIcon,
  MoonIcon,
  PanelRightIcon,
  PlusIcon,
  SunIcon,
} from "lucide-react";
import type { AppView } from "@/app/state/app-state";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useTheme, type Theme } from "@/hooks/theme-context";
import { cn } from "@/lib/utils";

const VIEW_TITLES: Record<Exclude<AppView, "providers-add">, string> = {
  launchpad: "Home",
  chat: "Chat",
  providers: "Providers",
  agents: "Agents",
  brain: "Brain",
  watchlist: "Watchlist",
  library: "Library",
  automation: "Automation",
  settings: "Settings",
};

interface AppHeaderProps {
  currentView: Exclude<AppView, "providers-add">;
  isRailOpen?: boolean;
  onAddConnection: () => void;
  onToggleRail?: () => void;
}

export function AppHeader({
  currentView,
  isRailOpen,
  onAddConnection,
  onToggleRail,
}: AppHeaderProps) {
  const pageTitle = VIEW_TITLES[currentView];

  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="flex h-12 items-center gap-3 px-4 lg:px-5">
        <SidebarTrigger className="-ml-1 text-muted-foreground/70 hover:text-foreground" />
        <Separator
          orientation="vertical"
          className="hidden data-[orientation=vertical]:h-4 sm:block"
        />

        <div className="min-w-0 flex-1">
          <h1 className="text-[13px] font-medium text-foreground">
            {pageTitle}
          </h1>
        </div>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />

          {currentView === "providers" ? (
            <Button
              size="sm"
              variant="outline"
              className="ml-1 hidden h-7 rounded-md px-2.5 text-[12px] font-medium lg:inline-flex"
              onClick={onAddConnection}
            >
              <PlusIcon className="size-3" />
              Add
            </Button>
          ) : null}

          {onToggleRail ? (
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "size-7 text-muted-foreground/70 hover:text-foreground",
                isRailOpen && "bg-accent text-foreground",
              )}
              onClick={onToggleRail}
              title={isRailOpen ? "Close panel" : "Open panel"}
            >
              <PanelRightIcon className="size-3.5" />
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  /* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
  const options: { value: Theme; icon: LucideIcon; label: string }[] = [
    { value: "light", icon: SunIcon, label: "Light" },
    { value: "dark", icon: MoonIcon, label: "Dark" },
    { value: "system", icon: MonitorIcon, label: "System" },
  ];
  /* eslint-enable @typescript-eslint/no-unsafe-assignment */

  return (
    <div className="flex items-center rounded-md border border-border/60 bg-muted/50 p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          title={option.label}
          className={cn(
            "flex size-6 items-center justify-center rounded-[3px] transition-all duration-150",
            theme === option.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => {
            setTheme(option.value);
          }}
        >
          <option.icon className="size-3" />
        </button>
      ))}
    </div>
  );
}
