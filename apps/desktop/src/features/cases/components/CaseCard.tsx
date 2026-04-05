import type { InvestmentCase } from "@capyfin/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfidenceBadge } from "@/components/report/ConfidenceBadge";
import { StanceBadge } from "./StanceBadge";

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

  const reviewedDate = new Date(investmentCase.lastReviewedAt);
  const formattedDate = reviewedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card
      className={`cursor-pointer overflow-hidden rounded-xl border-border/50 transition-all hover:-translate-y-0.5 hover:border-border/70 hover:bg-muted/20 hover:shadow-md hover:shadow-black/[0.03] dark:border-border/30 dark:hover:border-border/50 dark:hover:shadow-black/20 ${selected === true ? "ring-2 ring-primary" : ""} ${selected === false ? "opacity-60" : ""}`}
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
        <p className="mt-2.5 text-[11px] text-muted-foreground/50">
          Last reviewed {formattedDate}
        </p>
      </CardContent>
    </Card>
  );
}
