import type { SavedReport } from "@capyfin/contracts";
import { BookOpenIcon, LoaderCircleIcon, SearchXIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { SidecarClient } from "@/lib/sidecar/client";
import {
  copyReportToClipboard,
  downloadReportAsMarkdown,
} from "@/features/library/export-markdown";
import {
  LibraryFilters,
  INITIAL_FILTER_STATE,
  type LibraryFilterState,
} from "./LibraryFilters";
import { ReportDetailDialog } from "./ReportDetailDialog";
import { SavedReportCard } from "./SavedReportCard";

export const LIBRARY_EMPTY_TEXT =
  "No saved reports yet. Research outputs and saved analyses will appear here.";

interface LibraryWorkspaceProps {
  client: SidecarClient | null;
}

export function LibraryWorkspace({ client }: LibraryWorkspaceProps) {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] =
    useState<LibraryFilterState>(INITIAL_FILTER_STATE);
  const [selectedReport, setSelectedReport] = useState<SavedReport | null>(
    null,
  );

  const fetchReports = useCallback(async () => {
    if (!client) return;
    try {
      setIsLoading(true);
      setError(null);
      const result = await client.listReports();
      setReports(result.reports);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  const workflowTypes = useMemo(() => {
    const types = new Set(reports.map((r) => r.workflowType));
    return [...types].sort();
  }, [reports]);

  const filteredReports = useMemo(() => {
    let result = reports;

    if (filters.search) {
      const lower = filters.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.cardOutput.title.toLowerCase().includes(lower) ||
          (r.subject?.toLowerCase().includes(lower) ?? false) ||
          r.cardOutput.summary.toLowerCase().includes(lower),
      );
    }

    if (filters.workflowType) {
      result = result.filter((r) => r.workflowType === filters.workflowType);
    }

    if (filters.view === "pinned") {
      result = result.filter((r) => r.pinnedAt !== null);
    } else if (filters.view === "starred") {
      result = result.filter((r) => r.starred);
    }

    // Sort: pinned first, then by savedAt descending
    return result.sort((a, b) => {
      if (a.pinnedAt && !b.pinnedAt) return -1;
      if (!a.pinnedAt && b.pinnedAt) return 1;
      return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
    });
  }, [reports, filters]);

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
    filters.view !== "all";

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
      {reports.length > 0 ? (
        <>
          <LibraryFilters
            filters={filters}
            workflowTypes={workflowTypes}
            onChange={setFilters}
          />

          {filteredReports.length > 0 ? (
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
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 py-20">
          <div className="relative">
            <div className="absolute -inset-3 rounded-2xl bg-violet-500/[0.06] blur-xl dark:bg-violet-500/[0.08]" />
            <div className="relative flex size-14 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/[0.08] dark:bg-violet-500/[0.1]">
              <BookOpenIcon className="size-6 text-violet-500" />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-[17px] font-semibold text-foreground">
              Your research library
            </h2>
            <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
              {LIBRARY_EMPTY_TEXT}
            </p>
          </div>
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
