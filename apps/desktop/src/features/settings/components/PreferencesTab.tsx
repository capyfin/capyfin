import { useState } from "react";
import { CheckIcon, LoaderCircleIcon } from "lucide-react";
import type { UserPreferences } from "@/app/types";
import { Button } from "@/components/ui/button";
import { FeedbackBanner } from "@/components/FeedbackBanner";
import { getErrorMessage } from "@/lib/utils";
import type { SidecarClient } from "@/lib/sidecar/client";

const INVESTMENT_STYLES = [
  { value: "", label: "Not set" },
  { value: "growth", label: "Growth" },
  { value: "value", label: "Value" },
  { value: "blend", label: "Blend" },
  { value: "income", label: "Income" },
] as const;

const TIME_HORIZONS = [
  { value: "", label: "Not set" },
  { value: "short", label: "Short-term (< 1 year)" },
  { value: "medium", label: "Medium-term (1–5 years)" },
  { value: "long", label: "Long-term (5+ years)" },
] as const;

const RISK_TOLERANCES = [
  { value: "", label: "Not set" },
  { value: "conservative", label: "Conservative" },
  { value: "moderate", label: "Moderate" },
  { value: "aggressive", label: "Aggressive" },
] as const;

const MARKET_FOCUSES = [
  { value: "", label: "Not set" },
  { value: "us", label: "US Markets" },
  { value: "global", label: "Global Markets" },
  { value: "emerging", label: "Emerging Markets" },
] as const;

const REPORT_DENSITIES = [
  { value: "", label: "Not set" },
  { value: "brief", label: "Brief" },
  { value: "standard", label: "Standard" },
  { value: "detailed", label: "Detailed" },
] as const;

const SECTORS = [
  "Technology",
  "Healthcare",
  "Financial Services",
  "Consumer Discretionary",
  "Consumer Staples",
  "Industrials",
  "Energy",
  "Materials",
  "Real Estate",
  "Utilities",
  "Communication Services",
];

interface PreferencesTabProps {
  client: SidecarClient | null;
  preferences: UserPreferences | null;
  onPreferencesChange: (preferences: UserPreferences) => void;
}

export function PreferencesTab({
  client,
  preferences,
  onPreferencesChange,
}: PreferencesTabProps) {
  const [investmentStyle, setInvestmentStyle] = useState(
    preferences?.investmentStyle ?? "",
  );
  const [timeHorizon, setTimeHorizon] = useState(
    preferences?.timeHorizon ?? "",
  );
  const [riskTolerance, setRiskTolerance] = useState(
    preferences?.riskTolerance ?? "",
  );
  const [marketFocus, setMarketFocus] = useState(
    preferences?.preferredMarketFocus ?? "",
  );
  const [reportDensity, setReportDensity] = useState(
    preferences?.reportDensity ?? "",
  );
  const [favoriteSectors, setFavoriteSectors] = useState<string[]>(
    preferences?.favoriteSectors ?? [],
  );
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function toggleSector(sector: string) {
    setFavoriteSectors((current) =>
      current.includes(sector)
        ? current.filter((s) => s !== sector)
        : [...current, sector],
    );
  }

  async function handleSave(): Promise<void> {
    if (!client) return;
    setIsSaving(true);
    setFeedback(null);
    setErrorMessage(null);
    try {
      const updated = await client.updatePreferences({
        investmentStyle: (investmentStyle ||
          null) as UserPreferences["investmentStyle"],
        timeHorizon: (timeHorizon || null) as UserPreferences["timeHorizon"],
        riskTolerance: (riskTolerance ||
          null) as UserPreferences["riskTolerance"],
        preferredMarketFocus: (marketFocus ||
          null) as UserPreferences["preferredMarketFocus"],
        reportDensity: (reportDensity ||
          null) as UserPreferences["reportDensity"],
        favoriteSectors,
      });
      onPreferencesChange(updated);
      setFeedback("Preferences saved.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5" data-testid="preferences-tab">
      <div>
        <h2 className="text-[15px] font-semibold text-foreground">
          Preferences
        </h2>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          Tailor analysis and reports to your investment profile.
        </p>
      </div>

      {errorMessage ? (
        <FeedbackBanner tone="error">{errorMessage}</FeedbackBanner>
      ) : null}
      {feedback ? (
        <FeedbackBanner tone="success">{feedback}</FeedbackBanner>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Investment Style"
          value={investmentStyle}
          options={INVESTMENT_STYLES}
          onChange={setInvestmentStyle}
        />
        <SelectField
          label="Time Horizon"
          value={timeHorizon}
          options={TIME_HORIZONS}
          onChange={setTimeHorizon}
        />
        <SelectField
          label="Risk Tolerance"
          value={riskTolerance}
          options={RISK_TOLERANCES}
          onChange={setRiskTolerance}
        />
        <SelectField
          label="Market Focus"
          value={marketFocus}
          options={MARKET_FOCUSES}
          onChange={setMarketFocus}
        />
        <SelectField
          label="Report Density"
          value={reportDensity}
          options={REPORT_DENSITIES}
          onChange={setReportDensity}
        />
      </div>

      <div>
        <label className="mb-2 block text-[13px] font-medium text-foreground">
          Favorite Sectors
        </label>
        <div className="flex flex-wrap gap-2">
          {SECTORS.map((sector) => {
            const isSelected = favoriteSectors.includes(sector);
            return (
              <button
                key={sector}
                type="button"
                className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] transition-colors ${
                  isSelected
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/60 bg-card text-muted-foreground hover:border-border hover:text-foreground"
                }`}
                onClick={() => {
                  toggleSector(sector);
                }}
              >
                {isSelected ? <CheckIcon className="size-3" /> : null}
                {sector}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          className="h-8 rounded-md px-4 text-[12px]"
          disabled={!client || isSaving}
          onClick={() => {
            void handleSave();
          }}
        >
          {isSaving ? (
            <LoaderCircleIcon className="size-3.5 animate-spin" />
          ) : null}
          Save Preferences
        </Button>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { readonly value: string; readonly label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium text-foreground">
        {label}
      </label>
      <select
        className="h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] text-foreground outline-none transition-colors focus:border-primary"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
