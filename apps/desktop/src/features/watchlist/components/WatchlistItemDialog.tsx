import type { WatchlistItem } from "@capyfin/contracts";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { SidecarClient } from "@/lib/sidecar/client";

interface WatchlistItemDialogProps {
  client: SidecarClient;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  editItem?: WatchlistItem | undefined;
}

export function WatchlistItemDialog({
  client,
  open,
  onClose,
  onSave,
  editItem,
}: WatchlistItemDialogProps) {
  const isEdit = editItem !== undefined;

  const [ticker, setTicker] = useState("");
  const [list, setList] = useState<"position" | "watching">("watching");
  const [note, setNote] = useState("");
  const [thesis, setThesis] = useState("");
  const [targetZone, setTargetZone] = useState("");
  const [tags, setTags] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setTicker("");
    setList("watching");
    setNote("");
    setThesis("");
    setTargetZone("");
    setTags("");
    setError(null);
  }, []);

  useEffect(() => {
    if (open && editItem) {
      setTicker(editItem.ticker);
      setList(editItem.list);
      setNote(editItem.note ?? "");
      setThesis(editItem.thesis ?? "");
      setTargetZone(editItem.targetZone ?? "");
      setTags(editItem.tags?.join(", ") ?? "");
      setError(null);
    } else if (open) {
      resetForm();
    }
  }, [open, editItem, resetForm]);

  const handleSubmit = useCallback(async () => {
    const trimmedTicker = ticker.trim().toUpperCase();
    if (!trimmedTicker) {
      setError("Ticker is required.");
      return;
    }

    const parsedTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      setIsSaving(true);
      setError(null);

      if (isEdit) {
        await client.updateWatchlistItem(trimmedTicker, {
          list,
          ...(note.trim() ? { note: note.trim() } : { note: undefined }),
          ...(thesis.trim()
            ? { thesis: thesis.trim() }
            : { thesis: undefined }),
          ...(targetZone.trim()
            ? { targetZone: targetZone.trim() }
            : { targetZone: undefined }),
          ...(parsedTags.length > 0 ? { tags: parsedTags } : {}),
        });
      } else {
        await client.addWatchlistItem({
          ticker: trimmedTicker,
          list,
          ...(note.trim() ? { note: note.trim() } : {}),
          ...(thesis.trim() ? { thesis: thesis.trim() } : {}),
          ...(targetZone.trim() ? { targetZone: targetZone.trim() } : {}),
          ...(parsedTags.length > 0 ? { tags: parsedTags } : {}),
        });
      }

      resetForm();
      onSave();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save watchlist item",
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    client,
    isEdit,
    ticker,
    list,
    note,
    thesis,
    targetZone,
    tags,
    resetForm,
    onSave,
  ]);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        resetForm();
        onClose();
      }
    },
    [resetForm, onClose],
  );

  const isValid = ticker.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Ticker" : "Add Ticker"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Update details for ${editItem.ticker}.`
              : "Add a new ticker to your watchlist."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
        >
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="wl-ticker"
              className="text-xs font-medium text-muted-foreground"
            >
              Ticker *
            </label>
            <Input
              id="wl-ticker"
              placeholder="e.g. AAPL"
              value={ticker}
              disabled={isEdit}
              onChange={(e) => {
                setTicker(e.target.value);
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="wl-list"
              className="text-xs font-medium text-muted-foreground"
            >
              List Type
            </label>
            <Select
              value={list}
              onValueChange={(v: "position" | "watching") => {
                setList(v);
              }}
            >
              <SelectTrigger id="wl-list">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="position">Position</SelectItem>
                <SelectItem value="watching">Watching</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="wl-note"
              className="text-xs font-medium text-muted-foreground"
            >
              Note
            </label>
            <Textarea
              id="wl-note"
              placeholder="Quick note (optional)"
              rows={2}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="wl-thesis"
              className="text-xs font-medium text-muted-foreground"
            >
              Thesis
            </label>
            <Textarea
              id="wl-thesis"
              placeholder="Investment thesis (optional)"
              rows={2}
              value={thesis}
              onChange={(e) => {
                setThesis(e.target.value);
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="wl-target"
              className="text-xs font-medium text-muted-foreground"
            >
              Target Zone
            </label>
            <Input
              id="wl-target"
              placeholder="e.g. $120–$140 (optional)"
              value={targetZone}
              onChange={(e) => {
                setTargetZone(e.target.value);
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="wl-tags"
              className="text-xs font-medium text-muted-foreground"
            >
              Tags
            </label>
            <Input
              id="wl-tags"
              placeholder="tech, growth, earnings (comma-separated)"
              value={tags}
              onChange={(e) => {
                setTags(e.target.value);
              }}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </form>

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
            {isSaving ? "Saving..." : isEdit ? "Save Changes" : "Add Ticker"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
