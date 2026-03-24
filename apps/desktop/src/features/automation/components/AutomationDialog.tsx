import type {
  Automation,
  AutomationDestination,
  DeliveryChannel,
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
import { actionCards } from "@/features/launchpad/card-registry";
import type { SidecarClient } from "@/lib/sidecar/client";
import { STEP_LABELS } from "../schedule-utils";
import {
  DestinationStep,
  FiltersStep,
  ScheduleStep,
  SelectCardStep,
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
}

export function AutomationDialog({
  client,
  open,
  onClose,
  onSave,
  editAutomation,
}: AutomationDialogProps) {
  const isEdit = !!editAutomation;
  const schedulableCards = actionCards.filter((c) => c.schedulable);

  const [step, setStep] = useState(0);
  const [cardId, setCardId] = useState("");
  const [time, setTime] = useState("08:00");
  const [days, setDays] = useState<string[]>([
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
  ]);
  const [timezone, setTimezone] = useState(getDefaultTimezone());
  const [destination, setDestination] =
    useState<AutomationDestination>("library");
  const [watchlistOnly, setWatchlistOnly] = useState(false);
  const [sectorFocus, setSectorFocus] = useState("");
  const [channels, setChannels] = useState<DeliveryChannel[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setStep(0);
    setCardId("");
    setTime("08:00");
    setDays(["monday", "tuesday", "wednesday", "thursday", "friday"]);
    setTimezone(getDefaultTimezone());
    setDestination("library");
    setWatchlistOnly(false);
    setSectorFocus("");
    setError(null);
    setIsSaving(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (editAutomation) {
      setStep(0);
      setCardId(editAutomation.cardId);
      setTime(editAutomation.schedule.time);
      setDays([...editAutomation.schedule.days]);
      setTimezone(editAutomation.schedule.timezone);
      setDestination(editAutomation.destination);
      setWatchlistOnly(editAutomation.filters?.watchlistOnly ?? false);
      setSectorFocus(editAutomation.filters?.sectorFocus?.join(", ") ?? "");
      setError(null);
      setIsSaving(false);
    } else {
      resetForm();
    }
  }, [open, editAutomation, resetForm]);

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
      case 0:
        return !!cardId;
      case 1:
        return !!time && days.length > 0 && !!timezone;
      case 2:
        return !!destination;
      case 3:
        return true;
      default:
        return false;
    }
  };

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

      const payload = {
        cardId,
        cardTitle: selectedCard.title,
        schedule: {
          time,
          days: days as Automation["schedule"]["days"],
          timezone,
        },
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
            <ScheduleStep
              time={time}
              onTimeChange={setTime}
              days={days}
              onToggleDay={toggleDay}
              timezone={timezone}
              onTimezoneChange={setTimezone}
            />
          )}
          {step === 2 && (
            <DestinationStep
              destination={destination}
              onSelect={setDestination}
              channels={channels}
            />
          )}
          {step === 3 && (
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
          {step < 3 ? (
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
