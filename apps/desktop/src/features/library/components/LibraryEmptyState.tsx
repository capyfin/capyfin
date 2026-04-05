import {
  BookOpenIcon,
  FileTextIcon,
  GitCompareArrowsIcon,
  NewspaperIcon,
  SearchIcon,
  SparklesIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";

interface LibraryEmptyStateProps {
  onRunDeepDive: () => void;
  onStartMorningBrief: () => void;
  onWorkflowClick: (workflowId: string) => void;
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
const WORKFLOW_CARDS = [
  {
    id: "deep-dive",
    icon: SearchIcon,
    label: "Deep Dive",
    description: "Full investment case analysis",
    color: "text-blue-500",
    bg: "bg-blue-500/[0.08]",
    ring: "ring-blue-500/10",
    hoverBg: "hover:bg-blue-500/[0.12]",
    hoverBorder: "hover:border-blue-500/30",
  },
  {
    id: "morning-brief",
    icon: NewspaperIcon,
    label: "Morning Brief",
    description: "Daily market context & watchlist signals",
    color: "text-amber-500",
    bg: "bg-amber-500/[0.08]",
    ring: "ring-amber-500/10",
    hoverBg: "hover:bg-amber-500/[0.12]",
    hoverBorder: "hover:border-amber-500/30",
  },
  {
    id: "position-review",
    icon: FileTextIcon,
    label: "Position Review",
    description: "Re-underwrite a holding with fresh evidence",
    color: "text-emerald-500",
    bg: "bg-emerald-500/[0.08]",
    ring: "ring-emerald-500/10",
    hoverBg: "hover:bg-emerald-500/[0.12]",
    hoverBorder: "hover:border-emerald-500/30",
  },
  {
    id: "compare-companies",
    icon: GitCompareArrowsIcon,
    label: "Comparison",
    description: "Side-by-side case or peer comparison",
    color: "text-violet-500",
    bg: "bg-violet-500/[0.08]",
    ring: "ring-violet-500/10",
    hoverBg: "hover:bg-violet-500/[0.12]",
    hoverBorder: "hover:border-violet-500/30",
  },
];
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

export function LibraryEmptyState({
  onRunDeepDive,
  onStartMorningBrief,
  onWorkflowClick,
}: LibraryEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 py-12">
      <EmptyState
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lucide-react icon types
        icon={BookOpenIcon}
        iconColor="violet"
        heading="No reports yet"
        description="Research outputs from Deep Dives, Morning Briefs, and other workflows will appear here automatically."
        className="flex flex-col items-center gap-5"
      >
        <div className="flex gap-2">
          <Button size="sm" onClick={onRunDeepDive}>
            <SparklesIcon className="size-3.5" />
            Run a Deep Dive
          </Button>
          <Button variant="outline" size="sm" onClick={onStartMorningBrief}>
            <NewspaperIcon className="size-3.5" />
            Start a Morning Brief
          </Button>
        </div>
      </EmptyState>

      <div className="w-full max-w-lg">
        <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
          Create reports with
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {WORKFLOW_CARDS.map((card) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lucide-react icon types
            const Icon = card.icon;
            return (
              <button
                key={card.label}
                type="button"
                className={`flex cursor-pointer items-start gap-3 rounded-xl border border-border/40 bg-card/30 px-4 py-3.5 text-left transition-all dark:bg-card/20 ${card.hoverBg} ${card.hoverBorder}`}
                onClick={() => {
                  onWorkflowClick(card.id);
                }}
              >
                <div
                  className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ${card.bg} ${card.ring}`}
                >
                  <Icon className={`size-[18px] ${card.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-foreground/90">
                    {card.label}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground/60">
                    {card.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
