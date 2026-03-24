import { SparklesIcon } from "lucide-react";

interface FollowUpChipsProps {
  followUps: string[];
  onSuggestionClick: (suggestion: string) => void;
}

export function FollowUpChips({
  followUps,
  onSuggestionClick,
}: FollowUpChipsProps) {
  if (followUps.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        Suggested follow-ups
      </p>
      <div className="flex flex-wrap gap-2">
        {followUps.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 hover:border-primary/30"
            onClick={() => {
              onSuggestionClick(suggestion);
            }}
          >
            <SparklesIcon className="size-3" />
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
