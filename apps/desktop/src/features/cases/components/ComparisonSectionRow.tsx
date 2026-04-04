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
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">{aligned.title}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Left column */}
        <Card className={aligned.left ? "" : "border-dashed opacity-50"}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs text-muted-foreground">
              {leftLabel}
              {aligned.left ? (
                <ConfidenceBadge confidence={aligned.left.confidence} />
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {aligned.left ? (
              <div className="prose-sm max-h-64 overflow-y-auto">
                <MessageResponse>{aligned.left.content}</MessageResponse>
              </div>
            ) : (
              <p className="text-sm italic text-muted-foreground">
                Section not present
              </p>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <Card className={aligned.right ? "" : "border-dashed opacity-50"}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs text-muted-foreground">
              {rightLabel}
              {aligned.right ? (
                <ConfidenceBadge confidence={aligned.right.confidence} />
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {aligned.right ? (
              <div className="prose-sm max-h-64 overflow-y-auto">
                <MessageResponse>{aligned.right.content}</MessageResponse>
              </div>
            ) : (
              <p className="text-sm italic text-muted-foreground">
                Section not present
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
