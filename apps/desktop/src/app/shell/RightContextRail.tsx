import { XIcon } from "lucide-react";
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
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border/60 px-3">
        <h2 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
          Context
        </h2>
        <Button
          size="icon"
          variant="ghost"
          className="size-6 text-muted-foreground/70 hover:text-foreground"
          onClick={onClose}
          title="Close panel"
        >
          <XIcon className="size-3.5" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {children ?? (
          <p className="text-center text-[13px] text-muted-foreground/60">
            No context available
          </p>
        )}
      </div>
    </aside>
  );
}
