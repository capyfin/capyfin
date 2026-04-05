import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme, type Theme } from "@/hooks/theme-context";

interface ThemeOption {
  value: Theme;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
const THEME_OPTIONS: ThemeOption[] = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
];
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

export function AppearanceTab() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col gap-5" data-testid="appearance-tab">
      <p className="text-[13px] text-muted-foreground">
        Customize the look and feel of the application.
      </p>

      <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm dark:border-border/30">
        <div className="border-b border-border/40 bg-muted/[0.04] px-5 py-3">
          <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
            Theme
          </label>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-3 gap-3">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isActive = theme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`flex flex-col items-center gap-3 rounded-xl border p-5 transition-all duration-200 ${
                    isActive
                      ? "border-primary/30 bg-primary/[0.06] text-foreground shadow-sm shadow-primary/5 ring-1 ring-primary/15"
                      : "border-border/50 bg-background text-muted-foreground hover:border-border/70 hover:bg-muted/20 hover:text-foreground dark:border-border/30"
                  }`}
                  onClick={() => {
                    setTheme(option.value);
                  }}
                >
                  <div
                    className={`flex size-11 items-center justify-center rounded-xl transition-colors ${isActive ? "bg-primary/10 ring-1 ring-primary/10" : "bg-muted/50 dark:bg-muted/30"}`}
                  >
                    <Icon
                      className={`size-5 ${isActive ? "text-primary" : ""}`}
                    />
                  </div>
                  <span className="text-[12px] font-medium">
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
