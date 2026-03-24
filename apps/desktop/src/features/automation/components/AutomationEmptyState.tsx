import { PlusIcon, ZapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AUTOMATION_EMPTY_TEXT } from "./AutomationWorkspace";

interface AutomationEmptyStateProps {
  onCreate: () => void;
}

export function AutomationEmptyState({ onCreate }: AutomationEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
        <ZapIcon className="size-5 text-muted-foreground" />
      </div>
      <h2 className="text-[15px] font-semibold text-foreground">Automation</h2>
      <p className="max-w-sm text-center text-sm text-muted-foreground">
        {AUTOMATION_EMPTY_TEXT}
      </p>
      <Button variant="outline" size="sm" onClick={onCreate}>
        <PlusIcon className="size-3.5" />
        Create Automation
      </Button>
    </div>
  );
}
