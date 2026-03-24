import type { PortfolioOverview } from "@capyfin/contracts";
import { FileUpIcon, LoaderCircleIcon } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SidecarClient } from "@/lib/sidecar/client";

interface CsvImportDialogProps {
  client: SidecarClient;
  open: boolean;
  onClose: () => void;
  onImportComplete: (overview: PortfolioOverview) => void;
}

interface PreviewRow {
  ticker: string;
  shares: string;
  costBasis: string;
}

function parsePreview(csv: string): PreviewRow[] {
  const lines = csv
    .trim()
    .split("\n")
    .filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Simple header detection for preview
  const headerLine = lines[0];
  if (!headerLine) return [];
  const headers = headerLine
    .split(",")
    .map((h) => h.replace(/^"|"$/g, "").trim().toLowerCase());

  const tickerIdx = headers.findIndex((h) => ["ticker", "symbol"].includes(h));
  const sharesIdx = headers.findIndex((h) =>
    ["shares", "quantity", "units"].includes(h),
  );
  const costIdx = headers.findIndex((h) =>
    [
      "cost basis",
      "costbasis",
      "price",
      "avg cost",
      "average price",
      "avgcost",
    ].includes(h),
  );

  if (tickerIdx === -1 || sharesIdx === -1 || costIdx === -1) return [];

  return lines.slice(1, 11).map((line) => {
    const fields = line.split(",").map((f) => f.replace(/^"|"$/g, "").trim());
    return {
      ticker: fields[tickerIdx] ?? "",
      shares: fields[sharesIdx] ?? "",
      costBasis: fields[costIdx] ?? "",
    };
  });
}

export function CsvImportDialog({
  client,
  open,
  onClose,
  onImportComplete,
}: CsvImportDialogProps) {
  const [csvContent, setCsvContent] = useState<string>("");
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setFileName(file.name);
      setError(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setCsvContent(text);
        const rows = parsePreview(text);
        if (rows.length === 0) {
          setError(
            "Could not parse CSV. Expected columns: ticker/symbol, shares/quantity, cost basis/price.",
          );
        }
        setPreview(rows);
      };
      reader.readAsText(file);
    },
    [],
  );

  const handleImport = useCallback(async () => {
    if (!csvContent) return;
    try {
      setIsImporting(true);
      setError(null);
      const overview = await client.importPortfolioCsv(csvContent);
      setCsvContent("");
      setPreview([]);
      setFileName("");
      onImportComplete(overview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setIsImporting(false);
    }
  }, [client, csvContent, onImportComplete]);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setCsvContent("");
        setPreview([]);
        setFileName("");
        setError(null);
        onClose();
      }
    },
    [onClose],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Portfolio</DialogTitle>
          <DialogDescription>
            Upload a CSV file with your holdings. Expected columns: ticker or
            symbol, shares or quantity, cost basis or price.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileSelect}
          />

          <button
            type="button"
            className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border/70 p-6 text-center transition-colors hover:border-border hover:bg-muted/50"
            onClick={() => {
              fileInputRef.current?.click();
            }}
          >
            <FileUpIcon className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {fileName ? fileName : "Click to select a CSV file"}
            </p>
          </button>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {preview.length > 0 ? (
            <div className="max-h-48 overflow-auto rounded-lg border border-border/70">
              <Table>
                <TableHeader className="bg-muted/45">
                  <TableRow>
                    <TableHead>Ticker</TableHead>
                    <TableHead>Shares</TableHead>
                    <TableHead>Cost Basis</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((row, i) => (
                    <TableRow key={`${row.ticker}-${String(i)}`}>
                      <TableCell className="font-medium">
                        {row.ticker}
                      </TableCell>
                      <TableCell>{row.shares}</TableCell>
                      <TableCell>{row.costBasis}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={preview.length === 0 || isImporting}
            onClick={() => {
              void handleImport();
            }}
          >
            {isImporting ? (
              <LoaderCircleIcon className="size-3.5 animate-spin" />
            ) : null}
            {isImporting ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
