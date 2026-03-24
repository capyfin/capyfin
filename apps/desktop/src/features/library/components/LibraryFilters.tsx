import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";

export interface LibraryFilterState {
  search: string;
  workflowType: string;
  view: "all" | "pinned" | "starred";
}

export const INITIAL_FILTER_STATE: LibraryFilterState = {
  search: "",
  workflowType: "",
  view: "all",
};

interface LibraryFiltersProps {
  filters: LibraryFilterState;
  workflowTypes: string[];
  onChange: (filters: LibraryFilterState) => void;
}

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
];

export function LibraryFilters({
  filters,
  workflowTypes,
  onChange,
}: LibraryFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1">
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

      <select
        className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
  );
}
