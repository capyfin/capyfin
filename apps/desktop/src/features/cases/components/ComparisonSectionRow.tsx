import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfidenceBadge } from "@/components/report/ConfidenceBadge";
import { MessageResponse } from "@/components/ai-elements/message";
import type { AlignedSection } from "../comparison-utils";

interface ComparisonSectionRowProps {
  aligned: AlignedSection;
  leftLabel: string;
  rightLabel: string;
}

export function ComparisonSectionRow({
  aligned,
  leftLabel,
  rightLabel,
}: ComparisonSectionRowProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
        {aligned.title}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Left column */}
        <Card
          className={
            aligned.left
              ? "border-border/60"
              : "border-dashed border-border/40 opacity-50"
          }
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
              <span className="inline-block size-1.5 rounded-full bg-amber-500/60" />
              {leftLabel}
              {aligned.left ? (
                <ConfidenceBadge confidence={aligned.left.confidence} />
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {aligned.left ? (
              <div className="prose-sm max-h-72 overflow-y-auto">
                <MessageResponse>{aligned.left.content}</MessageResponse>
              </div>
            ) : (
              <p className="text-sm italic text-muted-foreground/60">
                Section not present
              </p>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <Card
          className={
            aligned.right
              ? "border-border/60"
              : "border-dashed border-border/40 opacity-50"
          }
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
              <span className="inline-block size-1.5 rounded-full bg-blue-500/60" />
              {rightLabel}
              {aligned.right ? (
                <ConfidenceBadge confidence={aligned.right.confidence} />
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {aligned.right ? (
              <div className="prose-sm max-h-72 overflow-y-auto">
                <MessageResponse>{aligned.right.content}</MessageResponse>
              </div>
            ) : (
              <p className="text-sm italic text-muted-foreground/60">
                Section not present
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
