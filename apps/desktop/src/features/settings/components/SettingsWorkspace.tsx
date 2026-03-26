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
  icon: React.ComponentType<{ className?: string }>;
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
export const SETTINGS_TABS: TabDefinition[] = [
  { id: "ai-models", label: "AI Models", icon: BotIcon },
  { id: "financial-data", label: "Financial Data", icon: DatabaseIcon },
  { id: "delivery-channels", label: "Delivery Channels", icon: SendIcon },
  { id: "appearance", label: "Appearance", icon: PaletteIcon },
  { id: "preferences", label: "Preferences", icon: SlidersHorizontalIcon },
  { id: "advanced", label: "Advanced", icon: CodeIcon },
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
  return (
    <div
      className="mx-auto w-full max-w-5xl flex-1"
      data-testid="settings-workspace"
    >
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
