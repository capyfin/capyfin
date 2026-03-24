import { ZapIcon } from "lucide-react";

export const AUTOMATION_EMPTY_TEXT =
  "No automations configured. Schedule recurring research and delivery workflows here.";

export function AutomationWorkspace() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-3 py-16">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
        <ZapIcon className="size-5 text-muted-foreground" />
      </div>
      <h2 className="text-[15px] font-semibold text-foreground">Automation</h2>
      <p className="max-w-sm text-center text-sm text-muted-foreground">
        {AUTOMATION_EMPTY_TEXT}
      </p>
    </div>
  );
}
