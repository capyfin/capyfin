import { BookOpenIcon, MessageCircleIcon, RocketIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LIBRARY_EMPTY_TEXT } from "./LibraryWorkspace";

interface LibraryEmptyStateProps {
  onGoToLaunchpad: () => void;
  onOpenChat: () => void;
}

export function LibraryEmptyState({
  onGoToLaunchpad,
  onOpenChat,
}: LibraryEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 py-20">
      <div className="relative">
        <div className="absolute -inset-3 rounded-2xl bg-violet-500/[0.06] blur-xl dark:bg-violet-500/[0.08]" />
        <div className="relative flex size-14 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/[0.08] dark:bg-violet-500/[0.1]">
          <BookOpenIcon className="size-6 text-violet-500" />
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-[17px] font-semibold text-foreground">
          Your research library
        </h2>
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
          {LIBRARY_EMPTY_TEXT}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onGoToLaunchpad}>
          <RocketIcon className="size-3.5" />
          Go to Launchpad
        </Button>
        <Button variant="ghost" size="sm" onClick={onOpenChat}>
          <MessageCircleIcon className="size-3.5" />
          Open Chat
        </Button>
      </div>
    </div>
  );
}
