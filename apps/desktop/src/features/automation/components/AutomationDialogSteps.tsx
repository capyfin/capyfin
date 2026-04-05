import type {
  AutomationDestination,
  DeliveryChannel,
  EventTriggerType,
} from "@capyfin/contracts";
import { CalendarClockIcon, CheckIcon, ZapIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActionCard } from "@/features/launchpad/types";
import { EVENT_TRIGGER_OPTIONS } from "../schedule-utils";

const DAYS = [
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
  { key: "sunday", label: "Sun" },
] as const;

const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
  "UTC",
];

interface SelectCardStepProps {
  schedulableCards: ActionCard[];
  cardId: string;
  onSelect: (id: string) => void;
}

export function SelectCardStep({
  schedulableCards,
  cardId,
  onSelect,
}: SelectCardStepProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Choose a card to automate.
      </p>
      <div className="flex flex-col gap-2">
        {schedulableCards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => {
              onSelect(card.id);
            }}
            className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
              cardId === card.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-foreground/20"
            }`}
          >
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-medium">{card.title}</span>
              <span className="text-xs text-muted-foreground">
                {card.promise}
              </span>
            </div>
            {cardId === card.id && (
              <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
            )}
          </button>
        ))}
        {schedulableCards.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No schedulable cards available.
          </p>
        )}
      </div>
    </div>
  );
}

interface TriggerTypeStepProps {
  triggerType: "schedule" | "event";
  onSelect: (type: "schedule" | "event") => void;
}

export function TriggerTypeStep({
  triggerType,
  onSelect,
}: TriggerTypeStepProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        How should this automation be triggered?
      </p>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => {
            onSelect("schedule");
          }}
          className={`flex items-center gap-3 rounded-lg border p-3.5 text-left transition-colors ${
            triggerType === "schedule"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-foreground/20"
          }`}
        >
          <div
            className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
              triggerType === "schedule"
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <CalendarClockIcon className="size-4" />
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-medium">Scheduled</span>
            <span className="text-xs text-muted-foreground">
              Runs on a recurring schedule
            </span>
          </div>
          {triggerType === "schedule" && (
            <CheckIcon className="ml-auto size-4 shrink-0 text-primary" />
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            onSelect("event");
          }}
          className={`flex items-center gap-3 rounded-lg border p-3.5 text-left transition-colors ${
            triggerType === "event"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-foreground/20"
          }`}
        >
          <div
            className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
              triggerType === "event"
                ? "bg-amber-500/10 text-amber-500"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <ZapIcon className="size-4" />
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-medium">Event-Driven</span>
            <span className="text-xs text-muted-foreground">
              Runs when a condition is detected
            </span>
          </div>
          {triggerType === "event" && (
            <CheckIcon className="ml-auto size-4 shrink-0 text-primary" />
          )}
        </button>
      </div>
    </div>
  );
}

interface EventTypeStepProps {
  eventType: EventTriggerType | "";
  onSelect: (type: EventTriggerType) => void;
}

export function EventTypeStep({ eventType, onSelect }: EventTypeStepProps) {
  const selected = EVENT_TRIGGER_OPTIONS.find((o) => o.value === eventType);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Which event should trigger this automation?
      </p>
      <Select
        value={eventType}
        onValueChange={(v) => {
          onSelect(v as EventTriggerType);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select an event type" />
        </SelectTrigger>
        <SelectContent position="popper">
          {EVENT_TRIGGER_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selected && (
        <p className="text-xs text-muted-foreground">
          This automation will run whenever the system detects:{" "}
          <span className="font-medium text-foreground">
            {selected.label.toLowerCase()}
          </span>
        </p>
      )}
    </div>
  );
}

interface ScheduleStepProps {
  time: string;
  onTimeChange: (t: string) => void;
  days: string[];
  onToggleDay: (day: string) => void;
  timezone: string;
  onTimezoneChange: (tz: string) => void;
}

export function ScheduleStep({
  time,
  onTimeChange,
  days,
  onToggleDay,
  timezone,
  onTimezoneChange,
}: ScheduleStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Time</label>
        <Input
          type="time"
          value={time}
          onChange={(e) => {
            onTimeChange(e.target.value);
          }}
          className="w-36"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Days</label>
        <div className="flex flex-wrap gap-1.5">
          {DAYS.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => {
                onToggleDay(d.key);
              }}
              className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                days.includes(d.key)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Timezone</label>
        <Select value={timezone} onValueChange={onTimezoneChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            {COMMON_TIMEZONES.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

interface DestinationStepProps {
  destination: AutomationDestination;
  onSelect: (d: AutomationDestination) => void;
  channels: DeliveryChannel[];
}

export function DestinationStep({
  destination,
  onSelect,
  channels,
}: DestinationStepProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Where should the output be delivered?
      </p>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => {
            onSelect("library");
          }}
          className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
            destination === "library"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-foreground/20"
          }`}
        >
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-medium">Library</span>
            <span className="text-xs text-muted-foreground">
              Save report to your library
            </span>
          </div>
          {destination === "library" && (
            <CheckIcon className="ml-auto size-4 shrink-0 text-primary" />
          )}
        </button>

        {channels
          .filter((ch) => ch.status === "connected")
          .map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => {
                onSelect(ch.type as AutomationDestination);
              }}
              className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                destination === ch.type
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-foreground/20"
              }`}
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-medium">{ch.label}</span>
                <Badge variant="secondary" className="w-fit text-[10px]">
                  {ch.type}
                </Badge>
              </div>
              {destination === ch.type && (
                <CheckIcon className="ml-auto size-4 shrink-0 text-primary" />
              )}
            </button>
          ))}
      </div>
    </div>
  );
}

interface FiltersStepProps {
  watchlistOnly: boolean;
  onWatchlistOnlyChange: (v: boolean) => void;
  sectorFocus: string;
  onSectorFocusChange: (v: string) => void;
}

export function FiltersStep({
  watchlistOnly,
  onWatchlistOnlyChange,
  sectorFocus,
  onSectorFocusChange,
}: FiltersStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Optionally narrow the automation scope.
      </p>

      <label className="flex items-center gap-2.5">
        <input
          type="checkbox"
          checked={watchlistOnly}
          onChange={(e) => {
            onWatchlistOnlyChange(e.target.checked);
          }}
          className="size-4 rounded border-border"
        />
        <span className="text-sm">Watchlist tickers only</span>
      </label>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">
          Sector Focus{" "}
          <span className="font-normal text-muted-foreground">
            (comma-separated)
          </span>
        </label>
        <Input
          placeholder="e.g. Technology, Healthcare"
          value={sectorFocus}
          onChange={(e) => {
            onSectorFocusChange(e.target.value);
          }}
        />
      </div>
    </div>
  );
}
