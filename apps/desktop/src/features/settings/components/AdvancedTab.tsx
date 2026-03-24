import { useState } from "react";
import { AlertTriangleIcon } from "lucide-react";
import type { UserPreferences } from "@/app/types";
import { FeedbackBanner } from "@/components/FeedbackBanner";
import { getErrorMessage } from "@/lib/utils";
import type { SidecarClient } from "@/lib/sidecar/client";

interface AdvancedTabProps {
  client: SidecarClient | null;
  preferences: UserPreferences | null;
  onPreferencesChange: (preferences: UserPreferences) => void;
}

export function AdvancedTab({
  client,
  preferences,
  onPreferencesChange,
}: AdvancedTabProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleToggle(
    field: "developerMode" | "traceVisibility",
    value: boolean,
  ): Promise<void> {
    if (!client) return;
    setErrorMessage(null);
    try {
      const updated = await client.updatePreferences({ [field]: value });
      onPreferencesChange(updated);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  }

  const developerMode = preferences?.developerMode ?? false;
  const traceVisibility = preferences?.traceVisibility ?? false;

  return (
    <div className="flex flex-col gap-5" data-testid="advanced-tab">
      <div>
        <h2 className="text-[15px] font-semibold text-foreground">Advanced</h2>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          Developer and debugging settings. These options are intended for
          advanced users.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
        <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
        <p className="text-[12px] text-yellow-700 dark:text-yellow-300">
          These settings are for power users. Changing them may affect
          application behavior.
        </p>
      </div>

      {errorMessage ? (
        <FeedbackBanner tone="error">{errorMessage}</FeedbackBanner>
      ) : null}

      <div className="flex flex-col gap-4">
        <ToggleRow
          label="Developer Mode"
          description="Enables additional debugging panels, verbose logging, and experimental features."
          checked={developerMode}
          disabled={!client}
          onChange={(value) => {
            void handleToggle("developerMode", value);
          }}
        />
        <ToggleRow
          label="Trace Visibility"
          description="Show AI reasoning traces and tool call details in the chat interface."
          checked={traceVisibility}
          disabled={!client}
          onChange={(value) => {
            void handleToggle("traceVisibility", value);
          }}
        />
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-card p-4">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-foreground">{label}</p>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={`relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          checked ? "bg-primary" : "bg-muted"
        } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
        onClick={() => {
          onChange(!checked);
        }}
      >
        <span
          className={`pointer-events-none block size-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
