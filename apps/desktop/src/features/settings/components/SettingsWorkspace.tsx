import { SettingsIcon, SlidersHorizontalIcon } from "lucide-react";

export const SETTINGS_DESCRIPTION =
  "Manage your AI providers, data connections, and application preferences.";

export function SettingsWorkspace() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4">
      <div className="flex flex-col items-center justify-center gap-3 py-10">
        <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
          <SettingsIcon className="size-5 text-muted-foreground" />
        </div>
        <h2 className="text-[15px] font-semibold text-foreground">Settings</h2>
        <p className="max-w-sm text-center text-sm text-muted-foreground">
          {SETTINGS_DESCRIPTION}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <a
          href="#providers"
          className="group flex items-center gap-3 rounded-lg border border-border/60 bg-card p-4 transition-colors hover:bg-accent/50"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <SlidersHorizontalIcon className="size-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-foreground">
              AI Providers
            </p>
            <p className="text-[12px] text-muted-foreground">
              Configure AI and data connections
            </p>
          </div>
        </a>
      </div>
    </div>
  );
}
