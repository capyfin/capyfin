import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface WorkflowsSectionProps {
  children: ReactNode;
}

export function WorkflowsSection({ children }: WorkflowsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="space-y-4">
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
        }}
        className="flex w-full items-center gap-2 text-left"
      >
        {isOpen ? (
          <ChevronDown className="size-3.5 text-muted-foreground/60" />
        ) : (
          <ChevronRight className="size-3.5 text-muted-foreground/60" />
        )}
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
          Workflows
        </h2>
        <div className="h-px flex-1 bg-border/50" />
      </button>

      {isOpen && <div className="space-y-8">{children}</div>}
    </section>
  );
}
