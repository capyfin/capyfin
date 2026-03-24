import type { OutputSection } from "@capyfin/contracts";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageResponse } from "@/components/ai-elements/message";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { ExternalLinkIcon } from "lucide-react";

interface OutputSectionCardProps {
  section: OutputSection;
}

export function OutputSectionCard({ section }: OutputSectionCardProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>{section.title}</CardTitle>
          <ConfidenceBadge confidence={section.confidence} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose-sm">
          <MessageResponse>{section.content}</MessageResponse>
        </div>
        {section.citations.length > 0 ? (
          <Accordion type="single" collapsible className="mt-3">
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
      </CardContent>
    </Card>
  );
}
