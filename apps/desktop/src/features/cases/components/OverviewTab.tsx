import type { Confidence, InvestmentCase } from "@capyfin/contracts";
import { ConfidenceBadge } from "@/components/report/ConfidenceBadge";
import { MessageResponse } from "@/components/ai-elements/message";
import { StanceBadge } from "./StanceBadge";

interface OverviewTabProps {
  investmentCase: InvestmentCase;
}

export function OverviewTab({ investmentCase }: OverviewTabProps) {
  const thesisSection = investmentCase.sections.find((s) => s.id === "thesis");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <StanceBadge stance={investmentCase.stance} />
        <ConfidenceBadge confidence={investmentCase.confidence} />
      </div>

      {thesisSection ? (
        <OverviewSection
          title="Thesis Summary"
          confidence={thesisSection.confidence}
        >
          <div className="prose-sm">
            <MessageResponse>{thesisSection.content}</MessageResponse>
          </div>
        </OverviewSection>
      ) : null}

      {investmentCase.keyAssumptions.length > 0 ? (
        <OverviewSection title="Key Assumptions">
          <ul className="space-y-1.5">
            {investmentCase.keyAssumptions.map((assumption, i) => (
              <li
                key={`assumption-${String(i)}`}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <span className="mt-1.5 block size-1.5 shrink-0 rounded-full bg-foreground/30" />
                {assumption}
              </li>
            ))}
          </ul>
        </OverviewSection>
      ) : null}

      {investmentCase.invalidationSignals.length > 0 ? (
        <OverviewSection title="Invalidation Signals">
          <ul className="space-y-1.5">
            {investmentCase.invalidationSignals.map((signal, i) => (
              <li
                key={`signal-${String(i)}`}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <span className="mt-1.5 block size-1.5 shrink-0 rounded-full bg-red-500/50" />
                {signal}
              </li>
            ))}
          </ul>
        </OverviewSection>
      ) : null}

      {investmentCase.nextActions.length > 0 ? (
        <OverviewSection title="Next Actions">
          <ul className="space-y-1.5">
            {investmentCase.nextActions.map((action, i) => (
              <li
                key={`action-${String(i)}`}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <span className="mt-1.5 block size-1.5 shrink-0 rounded-full bg-blue-500/50" />
                {action}
              </li>
            ))}
          </ul>
        </OverviewSection>
      ) : null}
    </div>
  );
}

function OverviewSection({
  title,
  confidence,
  children,
}: {
  title: string;
  confidence?: Confidence;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        {confidence ? <ConfidenceBadge confidence={confidence} /> : null}
      </div>
      {children}
    </div>
  );
}
