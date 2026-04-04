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

interface SectionTabProps {
  section: CaseSection | undefined;
  emptyMessage: string;
}

export function SectionTab({ section, emptyMessage }: SectionTabProps) {
  if (!section) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold">{section.title}</h3>
        <ConfidenceBadge confidence={section.confidence} />
      </div>

      <div className="prose-sm">
        <MessageResponse>{section.content}</MessageResponse>
      </div>

      {section.citations.length > 0 ? (
        <Accordion type="single" collapsible>
          <AccordionItem value="citations" className="border-none">
            <AccordionTrigger className="py-1.5 text-xs text-muted-foreground hover:no-underline">
              {section.citations.length} source
              {section.citations.length !== 1 ? "s" : ""}
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-1.5">
                {section.citations.map((citation, index) => (
                  <li
                    key={`${citation.source}-${String(index)}`}
                    className="flex items-start gap-1.5 text-xs text-muted-foreground"
                  >
                    <ExternalLinkIcon className="mt-0.5 size-3 shrink-0" />
                    <span>
                      <span className="font-medium text-foreground">
                        {citation.label}
                      </span>
                      {" — "}
                      {citation.source}
                      <span className="ml-1 text-muted-foreground/70">
                        ({citation.date})
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : null}
    </div>
  );
}
