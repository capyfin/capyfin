import type { CaseSection } from "@capyfin/contracts";
import { ConfidenceBadge } from "@/components/report/ConfidenceBadge";
import { MessageResponse } from "@/components/ai-elements/message";
import { ExternalLinkIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const SECTION_ACCENTS: Record<string, { border: string; gradient: string }> = {
  thesis: {
    border: "border-l-primary/50",
    gradient: "bg-gradient-to-r from-primary/[0.04] to-transparent",
  },
  valuation: {
    border: "border-l-emerald-500/50",
    gradient: "bg-gradient-to-r from-emerald-500/[0.04] to-transparent",
  },
  risks: {
    border: "border-l-red-500/50",
    gradient: "bg-gradient-to-r from-red-500/[0.04] to-transparent",
  },
  whatChanged: {
    border: "border-l-amber-500/50",
    gradient: "bg-gradient-to-r from-amber-500/[0.04] to-transparent",
  },
  catalysts: {
    border: "border-l-blue-500/50",
    gradient: "bg-gradient-to-r from-blue-500/[0.04] to-transparent",
  },
};

interface SectionTabProps {
  section: CaseSection | undefined;
  emptyMessage: string;
}

export function SectionTab({ section, emptyMessage }: SectionTabProps) {
  if (!section) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="relative mb-3">
          <div className="absolute -inset-3 rounded-full bg-muted/50 blur-lg" />
          <div className="relative flex size-10 items-center justify-center rounded-full bg-muted/80">
            <ExternalLinkIcon className="size-4 text-muted-foreground/50" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const accent = SECTION_ACCENTS[section.id];

  return (
    <div
      className={`overflow-hidden rounded-xl border border-border/50 border-l-2 bg-card shadow-sm dark:border-border/30 ${accent?.border ?? "border-l-primary/40"}`}
    >
      <div
        className={`flex items-center gap-2.5 border-b border-border/40 px-5 py-3 ${accent?.gradient ?? "bg-muted/[0.04]"}`}
      >
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
          {section.title}
        </h3>
        <ConfidenceBadge confidence={section.confidence} />
      </div>

      <div className="p-5">
        <div className="prose-sm">
          <MessageResponse>{section.content}</MessageResponse>
        </div>

        {section.citations.length > 0 ? (
          <div className="mt-5 border-t border-border/40 pt-4">
            <Accordion type="single" collapsible>
              <AccordionItem value="citations" className="border-none">
                <AccordionTrigger className="py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60 hover:text-muted-foreground hover:no-underline">
                  {section.citations.length} source
                  {section.citations.length !== 1 ? "s" : ""}
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 pt-1">
                    {section.citations.map((citation, index) => (
                      <li
                        key={`${citation.source}-${String(index)}`}
                        className="flex items-start gap-2 text-xs text-muted-foreground"
                      >
                        <ExternalLinkIcon className="mt-0.5 size-3 shrink-0 text-muted-foreground/50" />
                        <span>
                          <span className="font-medium text-foreground">
                            {citation.label}
                          </span>
                          {" — "}
                          {citation.source}
                          <span className="ml-1 text-muted-foreground/60">
                            ({citation.date})
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        ) : null}
      </div>
    </div>
  );
}
