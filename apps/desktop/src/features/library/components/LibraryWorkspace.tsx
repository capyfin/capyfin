import type { SavedReport, WatchlistItem } from "@capyfin/contracts";
import { LoaderCircleIcon, SearchXIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { SidecarClient } from "@/lib/sidecar/client";
import {
  copyReportToClipboard,
  downloadReportAsMarkdown,
} from "@/features/library/export-markdown";
import {
  LibraryFilters,
  INITIAL_FILTER_STATE,
  applyLibraryFilters,
  type LibraryFilterState,
} from "./LibraryFilters";
import { LibraryEmptyState } from "./LibraryEmptyState";
import { ReportDetailDialog } from "./ReportDetailDialog";
import { SavedReportCard } from "./SavedReportCard";

export const LIBRARY_EMPTY_TEXT =
  "No saved reports yet. Research outputs and saved analyses will appear here.";

interface LibraryWorkspaceProps {
  client: SidecarClient | null;
}

export function LibraryWorkspace({ client }: LibraryWorkspaceProps) {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] =
    useState<LibraryFilterState>(INITIAL_FILTER_STATE);
  const [selectedReport, setSelectedReport] = useState<SavedReport | null>(
    null,
  );

  const fetchData = useCallback(async () => {
    if (!client) return;
    try {
      setIsLoading(true);
      setError(null);
      const [reportsResult, watchlistResult] = await Promise.all([
        client.listReports(),
        client.getWatchlist().catch(() => ({ items: [] as WatchlistItem[] })),
      ]);
      setReports(reportsResult.reports);
      setWatchlistItems(watchlistResult.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const workflowTypes = useMemo(() => {
    const types = new Set(reports.map((r) => r.workflowType));
    return [...types].sort();
  }, [reports]);

  const companies = useMemo(() => {
    const subjects = new Set(
      reports.map((r) => r.subject).filter((s): s is string => s != null),
    );
    return [...subjects].sort();
  }, [reports]);

  const holdingTickers = useMemo(() => {
    return new Set(
      watchlistItems.filter((w) => w.list === "position").map((w) => w.ticker),
    );
  }, [watchlistItems]);

  const filteredReports = useMemo(() => {
    return applyLibraryFilters(reports, filters, holdingTickers);
  }, [reports, filters, holdingTickers]);

  const handlePin = useCallback(
    async (report: SavedReport) => {
      if (!client) return;
      const newPinnedAt = report.pinnedAt ? null : new Date().toISOString();
      const updated = await client.updateReport(report.id, {
        pinnedAt: newPinnedAt,
      });
      setReports((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r)),
      );
      if (selectedReport?.id === updated.id) {
        setSelectedReport(updated);
      }
    },
    [client, selectedReport],
  );

  const handleStar = useCallback(
    async (report: SavedReport) => {
      if (!client) return;
      const updated = await client.updateReport(report.id, {
        starred: !report.starred,
      });
      setReports((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r)),
      );
      if (selectedReport?.id === updated.id) {
        setSelectedReport(updated);
      }
    },
    [client, selectedReport],
  );

  const handleDelete = useCallback(
    async (report: SavedReport) => {
      if (!client) return;
      await client.deleteReport(report.id);
      setReports((prev) => prev.filter((r) => r.id !== report.id));
      if (selectedReport?.id === report.id) {
        setSelectedReport(null);
      }
    },
    [client, selectedReport],
  );

  const handleCopyMarkdown = useCallback((report: SavedReport) => {
    void copyReportToClipboard(report.cardOutput);
  }, []);

  const handleDownloadMarkdown = useCallback((report: SavedReport) => {
    downloadReportAsMarkdown(report.cardOutput);
  }, []);

  const hasActiveFilters =
    filters.search !== "" ||
    filters.workflowType !== "" ||
    filters.view !== "all" ||
    filters.company !== "" ||
    filters.dateSort !== "newest" ||
    filters.holdingStatus !== "all";

  if (!client) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Waiting for connection...
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LoaderCircleIcon className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4">
      <LibraryFilters
        filters={filters}
        workflowTypes={workflowTypes}
        companies={companies}
        onChange={setFilters}
      />

      {reports.length === 0 && !hasActiveFilters ? (
        <LibraryEmptyState
          onGoToLaunchpad={() => {
            window.location.hash = "#launchpad";
          }}
          onOpenChat={() => {
            window.location.hash = "#chat";
          }}
        />
      ) : filteredReports.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredReports.map((report) => (
            <SavedReportCard
              key={report.id}
              report={report}
              onOpen={setSelectedReport}
              onPin={(r) => {
                void handlePin(r);
              }}
              onStar={(r) => {
                void handleStar(r);
              }}
              onDelete={(r) => {
                void handleDelete(r);
              }}
              onCopyMarkdown={handleCopyMarkdown}
              onDownloadMarkdown={handleDownloadMarkdown}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
            <SearchXIcon className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            No matching reports found.
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => {
                setFilters(INITIAL_FILTER_STATE);
              }}
            >
              Clear filters
            </button>
          ) : null}
        </div>
      )}

      <ReportDetailDialog
        report={selectedReport}
        onClose={() => {
          setSelectedReport(null);
        }}
        onCopyMarkdown={handleCopyMarkdown}
        onDownloadMarkdown={handleDownloadMarkdown}
      />
    </div>
  );
}
