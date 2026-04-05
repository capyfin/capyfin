import type {
  Automation,
  AutomationDestination,
  DeliveryChannel,
  EventTriggerType,
} from "@capyfin/contracts";
import { CheckIcon, LoaderCircleIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { allCards } from "@/features/launchpad/card-registry";
import type { SidecarClient } from "@/lib/sidecar/client";
import { STEP_LABELS } from "../schedule-utils";
import {
  DestinationStep,
  EventTypeStep,
  FiltersStep,
  ScheduleStep,
  SelectCardStep,
  TriggerTypeStep,
} from "./AutomationDialogSteps";

function getDefaultTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

interface AutomationDialogProps {
  client: SidecarClient;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  editAutomation?: Automation | undefined;
  initialCardId?: string | undefined;
}

export function AutomationDialog({
  client,
  open,
  onClose,
  onSave,
  editAutomation,
  initialCardId,
}: AutomationDialogProps) {
  const isEdit = !!editAutomation;
  const schedulableCards = allCards.filter((c) => c.schedulable);

  const [step, setStep] = useState(0);
  const [cardId, setCardId] = useState("");
  const [triggerType, setTriggerType] = useState<"schedule" | "event">(
    "schedule",
  );
  const [eventType, setEventType] = useState<EventTriggerType | "">("");
  const [time, setTime] = useState("08:00");
  const [days, setDays] = useState<string[]>([
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
  ]);
  const [timezone, setTimezone] = useState(() => getDefaultTimezone());
  const [destination, setDestination] =
    useState<AutomationDestination>("library");
  const [watchlistOnly, setWatchlistOnly] = useState(false);
  const [sectorFocus, setSectorFocus] = useState("");
  const [channels, setChannels] = useState<DeliveryChannel[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = STEP_LABELS.length; // 5

  const resetForm = useCallback(
    (preselectedCardId?: string) => {
      const hasPreselect =
        preselectedCardId &&
        schedulableCards.some((c) => c.id === preselectedCardId);
      setStep(hasPreselect ? 1 : 0);
      setCardId(hasPreselect ? preselectedCardId : "");
      setTriggerType("schedule");
      setEventType("");
      setTime("08:00");
      setDays(["monday", "tuesday", "wednesday", "thursday", "friday"]);
      setTimezone(getDefaultTimezone());
      setDestination("library");
      setWatchlistOnly(false);
      setSectorFocus("");
      setError(null);
      setIsSaving(false);
    },
    [schedulableCards],
  );

  useEffect(() => {
    if (!open) return;
    if (editAutomation) {
      setStep(0);
      setCardId(editAutomation.cardId);
      if (editAutomation.trigger.type === "event") {
        setTriggerType("event");
        setEventType(editAutomation.trigger.eventType);
        setTime("08:00");
        setDays(["monday", "tuesday", "wednesday", "thursday", "friday"]);
        setTimezone(getDefaultTimezone());
      } else {
        setTriggerType("schedule");
        setEventType("");
        setTime(editAutomation.trigger.schedule.time);
        setDays([...editAutomation.trigger.schedule.days]);
        setTimezone(editAutomation.trigger.schedule.timezone);
      }
      setDestination(editAutomation.destination);
      setWatchlistOnly(editAutomation.filters?.watchlistOnly ?? false);
      setSectorFocus(editAutomation.filters?.sectorFocus?.join(", ") ?? "");
      setError(null);
      setIsSaving(false);
    } else {
      resetForm(initialCardId);
    }
  }, [open, editAutomation, initialCardId, resetForm]);

  useEffect(() => {
    if (open) {
      client
        .listDeliveryChannels()
        .then((res) => {
          setChannels(res.channels);
        })
        .catch(() => {
          setChannels([]);
        });
    }
  }, [open, client]);

  const selectedCard = schedulableCards.find((c) => c.id === cardId);

  const toggleDay = (day: string) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 0: // Card
        return !!cardId;
      case 1: // Trigger type
        return true;
      case 2: // When (schedule or event type)
        if (triggerType === "schedule") {
          return !!time && days.length > 0 && !!timezone;
        }
        return !!eventType;
      case 3: // Destination
        return !!destination;
      case 4: // Filters
        return true;
      default:
        return false;
    }
  };

  const lastStepIndex = totalSteps - 1;

  const handleSubmit = async () => {
    if (!selectedCard) return;
    try {
      setIsSaving(true);
      setError(null);
      const sectors = sectorFocus
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const filters =
        watchlistOnly || sectors.length > 0
          ? {
              watchlistOnly: watchlistOnly || undefined,
              sectorFocus: sectors.length > 0 ? sectors : undefined,
            }
          : null;

      const trigger =
        triggerType === "schedule"
          ? {
              type: "schedule" as const,
              schedule: {
                time,
                days: days as (
                  | "monday"
                  | "tuesday"
                  | "wednesday"
                  | "thursday"
                  | "friday"
                  | "saturday"
                  | "sunday"
                )[],
                timezone,
              },
            }
          : {
              type: "event" as const,
              eventType: eventType as EventTriggerType,
            };

      const payload = {
        cardId,
        cardTitle: selectedCard.title,
        trigger,
        destination,
        filters,
        enabled: editAutomation?.enabled ?? true,
      };

      if (editAutomation) {
        await client.updateAutomation(editAutomation.id, payload);
      } else {
        await client.createAutomation(payload);
      }
      onSave();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save automation",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Automation" : "Create Automation"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-1.5 px-1">
          {STEP_LABELS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                if (i < step) setStep(i);
              }}
              className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors ${
                i === step
                  ? "bg-primary/10 font-medium text-primary"
                  : i < step
                    ? "cursor-pointer text-muted-foreground hover:text-foreground"
                    : "text-muted-foreground/50"
              }`}
            >
              <span
                className={`flex size-4 items-center justify-center rounded-full text-[10px] ${
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {i < step ? <CheckIcon className="size-2.5" /> : i + 1}
              </span>
              {label}
            </button>
          ))}
        </div>

        <div className="min-h-[180px] py-2">
          {step === 0 && (
            <SelectCardStep
              schedulableCards={schedulableCards}
              cardId={cardId}
              onSelect={setCardId}
            />
          )}
          {step === 1 && (
            <TriggerTypeStep
              triggerType={triggerType}
              onSelect={setTriggerType}
            />
          )}
          {step === 2 &&
            (triggerType === "schedule" ? (
              <ScheduleStep
                time={time}
                onTimeChange={setTime}
                days={days}
                onToggleDay={toggleDay}
                timezone={timezone}
                onTimezoneChange={setTimezone}
              />
            ) : (
              <EventTypeStep eventType={eventType} onSelect={setEventType} />
            ))}
          {step === 3 && (
            <DestinationStep
              destination={destination}
              onSelect={setDestination}
              channels={channels}
            />
          )}
          {step === 4 && (
            <FiltersStep
              watchlistOnly={watchlistOnly}
              onWatchlistOnlyChange={setWatchlistOnly}
              sectorFocus={sectorFocus}
              onSectorFocusChange={setSectorFocus}
            />
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          {step > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                setStep((s) => s - 1);
              }}
              disabled={isSaving}
            >
              Back
            </Button>
          )}
          {step < lastStepIndex ? (
            <Button
              onClick={() => {
                setStep((s) => s + 1);
              }}
              disabled={!canProceed()}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={() => {
                void handleSubmit();
              }}
              disabled={isSaving || !canProceed()}
            >
              {isSaving ? (
                <LoaderCircleIcon className="size-3.5 animate-spin" />
              ) : null}
              {isEdit ? "Save Changes" : "Create Automation"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
