import { useState } from "react";
import {
  BotIcon,
  CodeIcon,
  DatabaseIcon,
  PaletteIcon,
  SendIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import type { AuthOverview, UserPreferences } from "@/app/types";
import type { SidecarClient } from "@/lib/sidecar/client";
import { AIModelsTab } from "./AIModelsTab";
import { FinancialDataTab } from "./FinancialDataTab";
import { DeliveryChannelsTab } from "./DeliveryChannelsTab";
import { AppearanceTab } from "./AppearanceTab";
import { PreferencesTab } from "./PreferencesTab";
import { AdvancedTab } from "./AdvancedTab";

export const SETTINGS_DESCRIPTION =
  "Manage your AI providers, data connections, and application preferences.";

export type SettingsTab =
  | "ai-models"
  | "financial-data"
  | "delivery-channels"
  | "appearance"
  | "preferences"
  | "advanced";

interface TabDefinition {
  id: SettingsTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
const TABS: TabDefinition[] = [
  { id: "ai-models", label: "AI Models", icon: BotIcon },
  { id: "financial-data", label: "Financial Data", icon: DatabaseIcon },
  { id: "delivery-channels", label: "Delivery Channels", icon: SendIcon },
  { id: "appearance", label: "Appearance", icon: PaletteIcon },
  { id: "preferences", label: "Preferences", icon: SlidersHorizontalIcon },
  { id: "advanced", label: "Advanced", icon: CodeIcon },
];
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

interface SettingsWorkspaceProps {
  authOverview: AuthOverview | null;
  client: SidecarClient | null;
  onAuthOverviewChange: (nextOverview: AuthOverview) => void;
  preferences: UserPreferences | null;
  onPreferencesChange: (preferences: UserPreferences) => void;
}

export function SettingsWorkspace({
  authOverview,
  client,
  onAuthOverviewChange,
  preferences,
  onPreferencesChange,
}: SettingsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("ai-models");

  return (
    <div
      className="mx-auto flex w-full max-w-5xl flex-1 gap-6"
      data-testid="settings-workspace"
    >
      {/* Left sidebar nav */}
      <nav
        className="hidden w-48 shrink-0 flex-col gap-1 sm:flex"
        data-testid="settings-nav"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${
                isActive
                  ? "bg-accent font-medium text-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
              onClick={() => {
                setActiveTab(tab.id);
              }}
            >
              <Icon className="size-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Mobile tab selector */}
      <div className="flex w-full flex-col sm:hidden">
        <select
          className="mb-4 rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground"
          value={activeTab}
          onChange={(e) => {
            setActiveTab(e.target.value as SettingsTab);
          }}
        >
          {TABS.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.label}
            </option>
          ))}
        </select>
        <div className="min-w-0 flex-1">
          <SettingsContent
            activeTab={activeTab}
            authOverview={authOverview}
            client={client}
            onAuthOverviewChange={onAuthOverviewChange}
            preferences={preferences}
            onPreferencesChange={onPreferencesChange}
          />
        </div>
      </div>

      {/* Desktop content area */}
      <div className="hidden min-w-0 flex-1 sm:block">
        <SettingsContent
          activeTab={activeTab}
          authOverview={authOverview}
          client={client}
          onAuthOverviewChange={onAuthOverviewChange}
          preferences={preferences}
          onPreferencesChange={onPreferencesChange}
        />
      </div>
    </div>
  );
}

function SettingsContent({
  activeTab,
  authOverview,
  client,
  onAuthOverviewChange,
  preferences,
  onPreferencesChange,
}: {
  activeTab: SettingsTab;
  authOverview: AuthOverview | null;
  client: SidecarClient | null;
  onAuthOverviewChange: (nextOverview: AuthOverview) => void;
  preferences: UserPreferences | null;
  onPreferencesChange: (preferences: UserPreferences) => void;
}) {
  switch (activeTab) {
    case "ai-models":
      return (
        <AIModelsTab
          authOverview={authOverview}
          client={client}
          onAuthOverviewChange={onAuthOverviewChange}
        />
      );
    case "financial-data":
      return <FinancialDataTab client={client} />;
    case "delivery-channels":
      return <DeliveryChannelsTab />;
    case "appearance":
      return <AppearanceTab />;
    case "preferences":
      return (
        <PreferencesTab
          client={client}
          preferences={preferences}
          onPreferencesChange={onPreferencesChange}
        />
      );
    case "advanced":
      return (
        <AdvancedTab
          client={client}
          preferences={preferences}
          onPreferencesChange={onPreferencesChange}
        />
      );
  }
}
