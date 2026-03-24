import { PlusIcon, ZapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AUTOMATION_EMPTY_TEXT } from "./AutomationWorkspace";

interface AutomationEmptyStateProps {
  onCreate: () => void;
}

export function AutomationEmptyState({ onCreate }: AutomationEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 py-20">
      <div className="relative">
        <div className="absolute -inset-3 rounded-2xl bg-amber-500/[0.06] blur-xl dark:bg-amber-500/[0.08]" />
        <div className="relative flex size-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/[0.08] dark:bg-amber-500/[0.1]">
          <ZapIcon className="size-6 text-amber-500" />
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-[17px] font-semibold text-foreground">
          Automate your research
        </h2>
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
          {AUTOMATION_EMPTY_TEXT}
        </p>
      </div>
      <Button size="sm" onClick={onCreate}>
        <PlusIcon className="size-3.5" />
        Create Automation
      </Button>
    </div>
  );
}
