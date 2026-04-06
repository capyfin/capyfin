import { InfoIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RightContextRailProps {
  children?: ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

export function RightContextRail({
  children,
  isOpen,
  onClose,
}: RightContextRailProps) {
  return (
    <aside
      data-testid="right-context-rail"
      className={cn(
        "flex shrink-0 flex-col border-l border-border/60 bg-background transition-[width] duration-200 ease-in-out",
        isOpen ? "w-72 lg:w-80" : "w-0 overflow-hidden border-l-0",
      )}
    >
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border/40 px-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
          Context
        </h2>
        <Button
          size="icon"
          variant="ghost"
          className="size-6 text-muted-foreground/50 hover:text-foreground"
          onClick={onClose}
          title="Close panel"
        >
          <XIcon className="size-3.5" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {children ?? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex size-9 items-center justify-center rounded-xl bg-muted/30">
              <InfoIcon className="size-4 text-muted-foreground/30" />
            </div>
            <p className="text-[13px] leading-relaxed text-muted-foreground/40">
              No context available
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
