/* eslint-disable react-refresh/only-export-components */
import type { SavedReport } from "@capyfin/contracts";
import { Input } from "@/components/ui/input";
import { ArrowDownUpIcon, SearchIcon } from "lucide-react";

export interface LibraryFilterState {
  search: string;
  workflowType: string;
  view: "all" | "pinned" | "starred" | "archived";
  company: string;
  dateSort: "newest" | "oldest";
  holdingStatus: "all" | "holdings" | "watching";
}

export const INITIAL_FILTER_STATE: LibraryFilterState = {
  search: "",
  workflowType: "",
  view: "all",
  company: "",
  dateSort: "newest",
  holdingStatus: "all",
};

function formatWorkflowType(type: string): string {
  return type
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const VIEW_OPTIONS = [
  { value: "all" as const, label: "All" },
  { value: "pinned" as const, label: "Pinned" },
  { value: "starred" as const, label: "Starred" },
  { value: "archived" as const, label: "Archived" },
];

const HOLDING_OPTIONS = [
  { value: "all" as const, label: "All Status" },
  { value: "holdings" as const, label: "Holdings" },
  { value: "watching" as const, label: "Watching" },
];

interface LibraryFiltersProps {
  filters: LibraryFilterState;
  workflowTypes: string[];
  companies: string[];
  onChange: (filters: LibraryFilterState) => void;
}

/**
 * Pure filter + sort function extracted for testability.
 * holdingTickers is the set of tickers that are current holdings (position list).
 */
export function applyLibraryFilters(
  reports: SavedReport[],
  filters: LibraryFilterState,
  holdingTickers: Set<string>,
): SavedReport[] {
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

  if (filters.company) {
    result = result.filter((r) => r.subject === filters.company);
  }

  if (filters.workflowType) {
    result = result.filter((r) => r.workflowType === filters.workflowType);
  }

  if (filters.view === "pinned") {
    result = result.filter((r) => r.pinnedAt !== null);
  } else if (filters.view === "starred") {
    result = result.filter((r) => r.starred);
  } else if (filters.view === "archived") {
    result = result.filter((r) => r.pinnedAt === null && !r.starred);
  }

  if (filters.holdingStatus === "holdings") {
    result = result.filter(
      (r) => r.subject != null && holdingTickers.has(r.subject),
    );
  } else if (filters.holdingStatus === "watching") {
    result = result.filter(
      (r) => r.subject == null || !holdingTickers.has(r.subject),
    );
  }

  // Sort: pinned first, then by date
  const dateDir = filters.dateSort === "oldest" ? -1 : 1;
  return result.sort((a, b) => {
    if (a.pinnedAt && !b.pinnedAt) return -1;
    if (!a.pinnedAt && b.pinnedAt) return 1;
    return (
      dateDir * (new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
    );
  });
}

const selectClass =
  "h-8 rounded-lg border border-input/70 bg-transparent px-2.5 text-[13px] text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 hover:border-input dark:border-input/50 dark:hover:border-input/70";

export function LibraryFilters({
  filters,
  workflowTypes,
  companies,
  onChange,
}: LibraryFiltersProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Row 1: search + view toggle */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-8 pl-8 text-sm"
            placeholder="Search reports..."
            value={filters.search}
            onChange={(e) => {
              onChange({ ...filters, search: e.target.value });
            }}
          />
        </div>

        <div className="inline-flex h-8 items-center gap-0.5 rounded-lg border border-input p-0.5">
          {VIEW_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                filters.view === opt.value
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => {
                onChange({ ...filters, view: opt.value });
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 2: dropdowns */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Company filter */}
        <select
          className={selectClass}
          value={filters.company}
          onChange={(e) => {
            onChange({ ...filters, company: e.target.value });
          }}
        >
          <option value="">All companies</option>
          {companies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Workflow type filter */}
        <select
          className={selectClass}
          value={filters.workflowType}
          onChange={(e) => {
            onChange({ ...filters, workflowType: e.target.value });
          }}
        >
          <option value="">All types</option>
          {workflowTypes.map((type) => (
            <option key={type} value={type}>
              {formatWorkflowType(type)}
            </option>
          ))}
        </select>

        {/* Holding status filter */}
        <div className="inline-flex h-8 items-center gap-0.5 rounded-lg border border-input p-0.5">
          {HOLDING_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                filters.holdingStatus === opt.value
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => {
                onChange({ ...filters, holdingStatus: opt.value });
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Date sort */}
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-input px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => {
            onChange({
              ...filters,
              dateSort: filters.dateSort === "newest" ? "oldest" : "newest",
            });
          }}
        >
          <ArrowDownUpIcon className="size-3.5" />
          {filters.dateSort === "newest" ? "Newest first" : "Oldest first"}
        </button>
      </div>
    </div>
  );
}
