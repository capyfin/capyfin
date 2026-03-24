import { BookOpenIcon, MessageCircleIcon, RocketIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
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
    <EmptyState
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lucide-react icon types
      icon={BookOpenIcon}
      iconColor="violet"
      heading="Your research library"
      description={LIBRARY_EMPTY_TEXT}
    >
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
    </EmptyState>
  );
}
