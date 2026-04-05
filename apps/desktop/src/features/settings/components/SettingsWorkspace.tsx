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
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
export const SETTINGS_TABS: TabDefinition[] = [
  {
    id: "ai-models",
    label: "AI Models",
    description:
      "Configure AI provider connections and select preferred models",
    icon: BotIcon,
  },
  {
    id: "financial-data",
    label: "Financial Data",
    description: "Connect market data sources for live prices and fundamentals",
    icon: DatabaseIcon,
  },
  {
    id: "delivery-channels",
    label: "Delivery Channels",
    description: "Set up email, messaging, or webhook destinations for reports",
    icon: SendIcon,
  },
  {
    id: "appearance",
    label: "Appearance",
    description: "Customize theme, density, and display preferences",
    icon: PaletteIcon,
  },
  {
    id: "preferences",
    label: "Preferences",
    description: "Set your investing style, risk tolerance, and review cadence",
    icon: SlidersHorizontalIcon,
  },
  {
    id: "advanced",
    label: "Advanced",
    description: "Developer settings, API access, and diagnostics",
    icon: CodeIcon,
  },
];
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

interface SettingsWorkspaceProps {
  activeTab: SettingsTab;
  authOverview: AuthOverview | null;
  client: SidecarClient | null;
  onAuthOverviewChange: (nextOverview: AuthOverview) => void;
  preferences: UserPreferences | null;
  onPreferencesChange: (preferences: UserPreferences) => void;
}

export function SettingsWorkspace({
  activeTab,
  authOverview,
  client,
  onAuthOverviewChange,
  preferences,
  onPreferencesChange,
}: SettingsWorkspaceProps) {
  const tabDef = SETTINGS_TABS.find((t) => t.id === activeTab);

  return (
    <div
      className="mx-auto w-full max-w-4xl flex-1"
      data-testid="settings-workspace"
    >
      {/* Active tab icon accent */}
      {tabDef ? (
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/[0.08] text-primary ring-1 ring-primary/10">
            <tabDef.icon className="size-5" />
          </div>
          <div>
            <h1 className="text-[17px] font-semibold tracking-tight">
              {tabDef.label}
            </h1>
            <p className="text-[13px] text-muted-foreground">
              {tabDef.description}
            </p>
          </div>
        </div>
      ) : null}

      <SettingsContent
        activeTab={activeTab}
        authOverview={authOverview}
        client={client}
        onAuthOverviewChange={onAuthOverviewChange}
        preferences={preferences}
        onPreferencesChange={onPreferencesChange}
      />
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
      return <DeliveryChannelsTab client={client} />;
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
