import type { Confidence, InvestmentCase } from "@capyfin/contracts";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ListChecksIcon,
  ShieldAlertIcon,
} from "lucide-react";
import { ConfidenceBadge } from "@/components/report/ConfidenceBadge";
import { MessageResponse } from "@/components/ai-elements/message";

interface OverviewTabProps {
  investmentCase: InvestmentCase;
}

export function OverviewTab({ investmentCase }: OverviewTabProps) {
  const thesisSection = investmentCase.sections.find((s) => s.id === "thesis");

  return (
    <div className="flex flex-col gap-5">
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
        <OverviewSection
          title="Key Assumptions"
          icon={<CheckCircle2Icon className="size-4 text-emerald-500" />}
        >
          <ul className="space-y-2">
            {investmentCase.keyAssumptions.map((assumption, i) => (
              <li
                key={`assumption-${String(i)}`}
                className="flex items-start gap-2.5 text-sm text-muted-foreground"
              >
                <span className="mt-1.5 block size-1.5 shrink-0 rounded-full bg-emerald-500/40" />
                {assumption}
              </li>
            ))}
          </ul>
        </OverviewSection>
      ) : null}

      {investmentCase.invalidationSignals.length > 0 ? (
        <OverviewSection
          title="Invalidation Signals"
          icon={<ShieldAlertIcon className="size-4 text-red-500/80" />}
          accentClass="border-red-500/10"
        >
          <ul className="space-y-2">
            {investmentCase.invalidationSignals.map((signal, i) => (
              <li
                key={`signal-${String(i)}`}
                className="flex items-start gap-2.5 text-sm text-muted-foreground"
              >
                <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0 text-red-500/50" />
                {signal}
              </li>
            ))}
          </ul>
        </OverviewSection>
      ) : null}

      {investmentCase.nextActions.length > 0 ? (
        <OverviewSection
          title="Next Actions"
          icon={<ListChecksIcon className="size-4 text-blue-500/80" />}
          accentClass="border-blue-500/10"
        >
          <ul className="space-y-2">
            {investmentCase.nextActions.map((action, i) => (
              <li
                key={`action-${String(i)}`}
                className="flex items-start gap-2.5 text-sm text-muted-foreground"
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
  icon,
  accentClass,
  children,
}: {
  title: string;
  confidence?: Confidence;
  icon?: React.ReactNode;
  accentClass?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm dark:border-border/30 ${accentClass ?? ""}`}
    >
      <div className="flex items-center gap-2.5 border-b border-border/40 bg-muted/[0.04] px-5 py-3">
        {icon}
        <h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {title}
        </h3>
        {confidence ? <ConfidenceBadge confidence={confidence} /> : null}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
