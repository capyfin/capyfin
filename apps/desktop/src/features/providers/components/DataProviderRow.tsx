import { useState } from "react";
import {
  CheckCircle2Icon,
  ExternalLinkIcon,
  LoaderCircleIcon,
  Trash2Icon,
} from "lucide-react";
import type { DataProviderStatus } from "@/app/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/utils";

interface DataProviderRowProps {
  provider: DataProviderStatus;
  onSaveKey: (providerId: string, apiKey: string) => Promise<void>;
  onDeleteKey: (providerId: string) => Promise<void>;
}

export function DataProviderRow({
  provider,
  onSaveKey,
  onDeleteKey,
}: DataProviderRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(): Promise<void> {
    if (!apiKey.trim()) return;
    setError(null);
    setIsBusy(true);
    try {
      await onSaveKey(provider.id, apiKey.trim());
      setApiKey("");
      setIsEditing(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDelete(): Promise<void> {
    setError(null);
    setIsBusy(true);
    try {
      await onDeleteKey(provider.id);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div
      data-testid={`data-provider-row-${provider.id}`}
      className="flex flex-col gap-2 rounded-lg border border-border/60 bg-card px-4 py-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-semibold text-foreground">
              {provider.name}
            </h3>
            <Badge
              variant="secondary"
              className="rounded-md px-1.5 text-[9px] font-medium"
            >
              {provider.tier}
            </Badge>
            {provider.connected ? (
              <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2Icon className="size-3" />
                Connected
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {provider.description}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <a
            href={provider.signupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Get API key
            <ExternalLinkIcon className="size-3" />
          </a>

          {provider.connected ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 rounded-md px-2 text-[11px] text-destructive hover:bg-destructive/8 hover:text-destructive"
              disabled={isBusy}
              onClick={() => {
                void handleDelete();
              }}
            >
              {isBusy ? (
                <LoaderCircleIcon className="size-3 animate-spin" />
              ) : (
                <Trash2Icon className="size-3" />
              )}
              Disconnect
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 rounded-md px-2.5 text-[11px] font-medium"
              disabled={isBusy}
              onClick={() => {
                setIsEditing(true);
              }}
            >
              Connect
            </Button>
          )}
        </div>
      </div>

      {isEditing && !provider.connected ? (
        <div className="flex items-center gap-2">
          <input
            type="password"
            placeholder="Paste your API key"
            className="h-8 flex-1 rounded-md border border-border bg-background px-2.5 text-[12px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary"
            value={apiKey}
            autoFocus
            onChange={(e) => {
              setApiKey(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void handleSave();
              }
              if (e.key === "Escape") {
                setIsEditing(false);
                setApiKey("");
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            className="h-8 rounded-md px-3 text-[12px] font-medium"
            disabled={isBusy || !apiKey.trim()}
            onClick={() => {
              void handleSave();
            }}
          >
            {isBusy ? (
              <LoaderCircleIcon className="size-3 animate-spin" />
            ) : null}
            Save
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-md px-2.5 text-[12px]"
            disabled={isBusy}
            onClick={() => {
              setIsEditing(false);
              setApiKey("");
            }}
          >
            Cancel
          </Button>
        </div>
      ) : null}

      {error ? (
        <p className="text-[11px] text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
