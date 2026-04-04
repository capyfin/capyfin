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
      className={`cursor-pointer transition-colors hover:bg-muted/50 ${selected === true ? "ring-2 ring-primary" : ""} ${selected === false ? "opacity-60" : ""}`}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2">
              <span className="font-semibold">{investmentCase.ticker}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {investmentCase.companyName}
              </span>
            </CardTitle>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <StanceBadge stance={investmentCase.stance} />
            <ConfidenceBadge confidence={investmentCase.confidence} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {snippet ? (
          <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
            {snippet}
          </p>
        ) : null}
        <p className="mt-2 text-xs text-muted-foreground/70">
          Last reviewed {formattedDate}
        </p>
      </CardContent>
    </Card>
  );
}
