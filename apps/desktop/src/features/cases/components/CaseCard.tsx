import type { InvestmentCase } from "@capyfin/contracts";
import { ActivityIcon, CalendarClockIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfidenceBadge } from "@/components/report/ConfidenceBadge";
import { StanceBadge } from "./StanceBadge";
import { AttentionBadge } from "./AttentionBadge";

const STANCE_BORDER: Record<string, string> = {
  bullish: "border-l-emerald-500/50",
  bearish: "border-l-red-500/50",
  neutral: "border-l-zinc-500/40",
  watching: "border-l-blue-500/50",
};

interface CaseCardProps {
  investmentCase: InvestmentCase;
  onClick: () => void;
  selected?: boolean | undefined;
}

export function CaseCard({ investmentCase, onClick, selected }: CaseCardProps) {
  const thesisSection = investmentCase.sections.find((s) => s.id === "thesis");
  const snippet = thesisSection?.content
    ? thesisSection.content.length > 120
      ? thesisSection.content.slice(0, 120) + "..."
      : thesisSection.content
    : null;

  const formattedDate = new Date(
    investmentCase.lastReviewedAt,
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const borderColor = STANCE_BORDER[investmentCase.stance] ?? "";

  return (
    <Card
      className={`cursor-pointer overflow-hidden rounded-xl border-l-2 border-border/50 transition-all hover:-translate-y-0.5 hover:border-border/70 hover:bg-gradient-to-r hover:from-primary/[0.03] hover:via-muted/15 hover:to-transparent hover:shadow-md hover:shadow-black/[0.03] dark:border-border/30 dark:hover:border-border/50 dark:hover:from-primary/[0.06] dark:hover:shadow-black/20 ${borderColor} ${selected === true ? "ring-2 ring-primary" : ""} ${selected === false ? "opacity-60" : ""}`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2.5">
            <span className="inline-flex items-center rounded-md bg-foreground/[0.05] px-2 py-0.5 font-mono text-[14px] font-bold tracking-wide dark:bg-foreground/[0.07]">
              {investmentCase.ticker}
            </span>
            <span className="text-[13px] font-normal text-muted-foreground">
              {investmentCase.companyName}
            </span>
          </CardTitle>
          <div className="flex shrink-0 items-center gap-1.5">
            {investmentCase.attentionState ? (
              <AttentionBadge state={investmentCase.attentionState} />
            ) : null}
            <StanceBadge stance={investmentCase.stance} />
            <ConfidenceBadge confidence={investmentCase.confidence} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {snippet ? (
          <p className="text-[13px] leading-relaxed text-muted-foreground line-clamp-2">
            {snippet}
          </p>
        ) : null}
        <div className="mt-2.5 flex items-center gap-3 text-[11px] text-muted-foreground/50">
          <span>Reviewed {formattedDate}</span>
          {investmentCase.monitoringEnabled ? (
            <span className="flex items-center gap-1">
              <ActivityIcon className="size-3 text-emerald-500/60" />
              Monitoring
            </span>
          ) : null}
          {investmentCase.nextCatalystDate ? (
            <span className="flex items-center gap-1">
              <CalendarClockIcon className="size-3 text-blue-500/60" />
              Catalyst{" "}
              {new Date(investmentCase.nextCatalystDate).toLocaleDateString(
                "en-US",
                { month: "short", day: "numeric" },
              )}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
