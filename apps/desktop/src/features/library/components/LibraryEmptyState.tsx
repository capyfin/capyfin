import {
  BookOpenIcon,
  FileTextIcon,
  GitCompareArrowsIcon,
  MessageCircleIcon,
  NewspaperIcon,
  RocketIcon,
  SearchIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { LIBRARY_EMPTY_TEXT } from "./LibraryWorkspace";

interface LibraryEmptyStateProps {
  onGoToHome: () => void;
  onOpenChat: () => void;
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
const EXAMPLE_REPORTS = [
  {
    icon: SearchIcon,
    label: "Deep Dive",
    description: "Full investment case analysis",
    color: "text-blue-500",
    bg: "bg-blue-500/[0.06]",
  },
  {
    icon: NewspaperIcon,
    label: "Morning Brief",
    description: "Daily market context & watchlist signals",
    color: "text-amber-500",
    bg: "bg-amber-500/[0.06]",
  },
  {
    icon: FileTextIcon,
    label: "Position Review",
    description: "Re-underwrite a holding with fresh evidence",
    color: "text-emerald-500",
    bg: "bg-emerald-500/[0.06]",
  },
  {
    icon: GitCompareArrowsIcon,
    label: "Comparison",
    description: "Side-by-side case or peer comparison",
    color: "text-violet-500",
    bg: "bg-violet-500/[0.06]",
  },
];
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

export function LibraryEmptyState({
  onGoToHome,
  onOpenChat,
}: LibraryEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 py-12">
      <EmptyState
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lucide-react icon types
        icon={BookOpenIcon}
        iconColor="violet"
        heading="Your research library"
        description={LIBRARY_EMPTY_TEXT}
        className="flex flex-col items-center gap-5"
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onGoToHome}>
            <RocketIcon className="size-3.5" />
            Go to Home
          </Button>
          <Button variant="ghost" size="sm" onClick={onOpenChat}>
            <MessageCircleIcon className="size-3.5" />
            Open Chat
          </Button>
        </div>
      </EmptyState>

      <div className="w-full max-w-md">
        <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
          Reports you can save
        </p>
        <div className="grid grid-cols-2 gap-2">
          {EXAMPLE_REPORTS.map((example) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lucide-react icon types
            const Icon = example.icon;
            return (
              <div
                key={example.label}
                className="flex items-start gap-3 rounded-xl border border-border/30 bg-card/40 px-3.5 py-3 opacity-60"
              >
                <div
                  className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg ${example.bg}`}
                >
                  <Icon className={`size-3.5 ${example.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-foreground">
                    {example.label}
                  </p>
                  <p className="text-[11px] leading-snug text-muted-foreground/60">
                    {example.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
