/* eslint-disable react-refresh/only-export-components */
import type { DeliveryChannelType } from "@capyfin/contracts";
import { LoaderCircleIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ChannelConfigField {
  key: string;
  label: string;
  placeholder: string;
  type?: string;
}

interface ChannelConfig {
  fields: ChannelConfigField[];
}

export const CHANNEL_CONFIGS: Record<DeliveryChannelType, ChannelConfig> = {
  telegram: {
    fields: [
      {
        key: "botToken",
        label: "Bot Token",
        placeholder: "e.g. 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
      },
      { key: "chatId", label: "Chat ID", placeholder: "e.g. -1001234567890" },
    ],
  },
  discord: {
    fields: [
      {
        key: "webhookUrl",
        label: "Webhook URL",
        placeholder: "https://discord.com/api/webhooks/...",
      },
    ],
  },
  slack: {
    fields: [
      {
        key: "webhookUrl",
        label: "Webhook URL",
        placeholder: "https://hooks.slack.com/services/...",
      },
    ],
  },
  email: {
    fields: [
      {
        key: "address",
        label: "Email Address",
        placeholder: "e.g. alerts@example.com",
        type: "email",
      },
    ],
  },
  whatsapp: {
    fields: [
      {
        key: "phoneNumber",
        label: "Phone Number",
        placeholder: "e.g. +1 234 567 8900",
        type: "tel",
      },
    ],
  },
};

interface ChannelConnectFormProps {
  channelType: DeliveryChannelType | null;
  channelLabel: string;
  open: boolean;
  onClose: () => void;
  onConnect: (
    type: DeliveryChannelType,
    config: Record<string, string>,
  ) => Promise<void>;
}

export function ChannelConnectForm({
  channelType,
  channelLabel,
  open,
  onClose,
  onConnect,
}: ChannelConnectFormProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = channelType ? CHANNEL_CONFIGS[channelType] : null;

  useEffect(() => {
    if (open) {
      setValues({});
      setError(null);
    }
  }, [open]);

  const handleSubmit = useCallback(async () => {
    if (!channelType || !config) return;

    // Validate all fields are filled
    for (const field of config.fields) {
      if (!values[field.key]?.trim()) {
        setError(`${field.label} is required.`);
        return;
      }
    }

    try {
      setIsSaving(true);
      setError(null);
      const trimmedValues: Record<string, string> = {};
      for (const field of config.fields) {
        trimmedValues[field.key] = (values[field.key] ?? "").trim();
      }
      await onConnect(channelType, trimmedValues);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect channel",
      );
    } finally {
      setIsSaving(false);
    }
  }, [channelType, config, values, onConnect, onClose]);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        onClose();
      }
    },
    [onClose],
  );

  const isValid =
    config?.fields.every((f) => (values[f.key]?.trim().length ?? 0) > 0) ??
    false;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Connect {channelLabel}</DialogTitle>
          <DialogDescription>
            Enter your {channelLabel} configuration to start receiving
            deliveries.
          </DialogDescription>
        </DialogHeader>

        {config ? (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit();
            }}
          >
            {config.fields.map((field) => (
              <div key={field.key} className="flex flex-col gap-1.5">
                <label
                  htmlFor={`ch-${field.key}`}
                  className="text-xs font-medium text-muted-foreground"
                >
                  {field.label}
                </label>
                <Input
                  id={`ch-${field.key}`}
                  type={field.type ?? "text"}
                  placeholder={field.placeholder}
                  value={values[field.key] ?? ""}
                  onChange={(e) => {
                    setValues((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }));
                  }}
                />
              </div>
            ))}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </form>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!isValid || isSaving}
            onClick={() => {
              void handleSubmit();
            }}
          >
            {isSaving ? (
              <LoaderCircleIcon className="size-3.5 animate-spin" />
            ) : null}
            {isSaving ? "Connecting..." : "Connect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
