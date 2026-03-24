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
      <div>
        <h2 className="text-[15px] font-semibold text-foreground">
          Appearance
        </h2>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          Customize the look and feel of the application.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-[13px] font-medium text-foreground">
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
                className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
                  isActive
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border/60 bg-card text-muted-foreground hover:border-border hover:text-foreground"
                }`}
                onClick={() => {
                  setTheme(option.value);
                }}
              >
                <Icon className="size-5" />
                <span className="text-[12px] font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
