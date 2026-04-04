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

      <div className="rounded-lg border border-border/60 bg-card p-5">
        <label className="mb-3 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          Theme
        </label>
        <div className="grid grid-cols-3 gap-3">
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                className={`flex flex-col items-center gap-2.5 rounded-lg border p-5 transition-all duration-200 ${
                  isActive
                    ? "border-primary/40 bg-primary/[0.06] text-foreground ring-1 ring-primary/20"
                    : "border-border/60 bg-background text-muted-foreground hover:border-border hover:bg-muted/30 hover:text-foreground"
                }`}
                onClick={() => {
                  setTheme(option.value);
                }}
              >
                <div
                  className={`flex size-10 items-center justify-center rounded-full ${isActive ? "bg-primary/10" : "bg-muted/60"}`}
                >
                  <Icon
                    className={`size-5 ${isActive ? "text-primary" : ""}`}
                  />
                </div>
                <span className="text-[12px] font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
