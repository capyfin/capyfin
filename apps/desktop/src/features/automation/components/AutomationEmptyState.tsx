import { PlusIcon, ZapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { AUTOMATION_EMPTY_TEXT } from "./AutomationWorkspace";

interface AutomationEmptyStateProps {
  onCreate: () => void;
}

export function AutomationEmptyState({ onCreate }: AutomationEmptyStateProps) {
  return (
    <EmptyState
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- lucide-react icon types
      icon={ZapIcon}
      iconColor="amber"
      heading="Automate your research"
      description={AUTOMATION_EMPTY_TEXT}
    >
      <Button size="sm" onClick={onCreate}>
        <PlusIcon className="size-3.5" />
        Create Automation
      </Button>
    </EmptyState>
  );
}
