import type { HTMLAttributes, ReactNode } from "react";
import {
  BrainCogIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  CircleIcon,
  LoaderCircleIcon,
  TriangleAlertIcon,
  WrenchIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ChainOfThoughtProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  defaultOpen?: boolean;
}

export function ChainOfThought({
  children,
  className,
  defaultOpen = true,
  ...props
}: ChainOfThoughtProps) {
  return (
    <div className={cn("w-full", className)} {...props}>
      <Accordion
        type="single"
        collapsible
        className="w-full"
        {...(defaultOpen ? { defaultValue: "steps" } : {})}
      >
        <AccordionItem
          value="steps"
          className="rounded-xl border border-border/60 bg-muted/20 px-3"
        >
          {children}
        </AccordionItem>
      </Accordion>
    </div>
  );
}

interface ChainOfThoughtHeaderProps extends HTMLAttributes<HTMLButtonElement> {
  activeCount?: number;
  children: ReactNode;
}

export function ChainOfThoughtHeader({
  activeCount,
  children,
  className,
  ...props
}: ChainOfThoughtHeaderProps) {
  return (
    <AccordionTrigger
      className={cn("items-center gap-3 py-3 no-underline hover:no-underline", className)}
      {...props}
    >
      <div className="flex min-w-0 items-center gap-2">
        <BrainCogIcon className="size-3.5 text-primary" />
        <span className="truncate text-[12px] font-medium text-foreground">
          {children}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {typeof activeCount === "number" && activeCount > 0 ? (
          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
            {String(activeCount)} active
          </span>
        ) : null}
        <ChevronRightIcon className="hidden" />
      </div>
    </AccordionTrigger>
  );
}

interface ChainOfThoughtContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function ChainOfThoughtContent({
  children,
  className,
  ...props
}: ChainOfThoughtContentProps) {
  return (
    <AccordionContent
      className={cn("space-y-2 pb-3 pt-1", className)}
      {...props}
    >
      {children}
    </AccordionContent>
  );
}

interface ChainOfThoughtStepProps extends HTMLAttributes<HTMLDivElement> {
  detail?: string;
  icon?: ReactNode;
  status: "pending" | "active" | "complete" | "error";
  title: string;
}

function getStatusIcon(status: ChainOfThoughtStepProps["status"], icon?: ReactNode) {
  if (icon) {
    return icon;
  }

  if (status === "active") {
    return <LoaderCircleIcon className="size-3.5 animate-spin text-primary" />;
  }

  if (status === "complete") {
    return <CheckCircle2Icon className="size-3.5 text-success" />;
  }

  if (status === "error") {
    return <TriangleAlertIcon className="size-3.5 text-destructive" />;
  }

  return <CircleIcon className="size-2.5 fill-current text-muted-foreground/70" />;
}

export function ChainOfThoughtStep({
  className,
  detail,
  icon,
  status,
  title,
  ...props
}: ChainOfThoughtStepProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg px-1 py-1.5 text-[12px]",
        className,
      )}
      {...props}
    >
      <div className="mt-0.5 shrink-0">{getStatusIcon(status, icon)}</div>
      <div className="min-w-0 space-y-0.5">
        <p className="font-medium text-foreground">{title}</p>
        {detail ? (
          <p className="text-muted-foreground">{detail}</p>
        ) : null}
      </div>
    </div>
  );
}

export function ChainOfThoughtToolIcon() {
  return <WrenchIcon className="size-3.5 text-primary" />;
}
