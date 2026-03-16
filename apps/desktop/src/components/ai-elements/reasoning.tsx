import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { BrainIcon, ChevronDownIcon } from "lucide-react";
import {
  createContext,
  useContext,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { Shimmer } from "./shimmer";

interface ReasoningContextValue {
  duration?: number;
  isOpen: boolean;
  isStreaming: boolean;
  setIsOpen: (open: boolean) => void;
}

const ReasoningContext = createContext<ReasoningContextValue | null>(null);

function useReasoningContext(): ReasoningContextValue {
  const value = useContext(ReasoningContext);
  if (!value) {
    throw new Error("Reasoning components must be used within <Reasoning />.");
  }

  return value;
}

interface ReasoningProps extends HTMLAttributes<HTMLDivElement> {
  autoCloseOnFinish?: boolean;
  children: ReactNode;
  defaultOpen?: boolean;
  duration?: number;
  isStreaming?: boolean;
}

export function Reasoning({
  children,
  className,
  defaultOpen,
  duration,
  isStreaming = false,
  ...props
}: ReasoningProps) {
  const [manualOpen, setManualOpen] = useState(defaultOpen ?? false);
  const isOpen = isStreaming || manualOpen;

  return (
    <ReasoningContext.Provider
      value={{
        isOpen,
        isStreaming,
        setIsOpen: setManualOpen,
        ...(duration === undefined ? {} : { duration }),
      }}
    >
      <div className={cn("space-y-2", className)} {...props}>
        {children}
      </div>
    </ReasoningContext.Provider>
  );
}

interface ReasoningTriggerProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  getThinkingMessage?: (isStreaming: boolean, duration?: number) => ReactNode;
}

function defaultThinkingMessage(isStreaming: boolean, duration?: number): ReactNode {
  if (isStreaming) {
    return <Shimmer>Thinking…</Shimmer>;
  }

  if (!duration) {
    return "Thought for a moment";
  }

  return `Thought for ${String(duration)}s`;
}

export function ReasoningTrigger({
  children,
  className,
  getThinkingMessage = defaultThinkingMessage,
  onClick,
  ...props
}: ReasoningTriggerProps) {
  const { duration, isOpen, isStreaming, setIsOpen } = useReasoningContext();

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-2 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          setIsOpen(!isOpen);
        }
      }}
      {...props}
    >
      {children ?? (
        <>
          <BrainIcon className="size-3.5" />
          <span>{getThinkingMessage(isStreaming, duration)}</span>
          <ChevronDownIcon
            className={cn(
              "size-3.5 transition-transform",
              isOpen ? "rotate-180" : "rotate-0",
            )}
          />
        </>
      )}
    </button>
  );
}

interface ReasoningContentProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export function ReasoningContent({
  children,
  className,
  ...props
}: ReasoningContentProps) {
  const { isOpen } = useReasoningContext();
  if (!isOpen || !children) {
    return null;
  }

  return (
    <div
      className={cn(
        "border-l border-border/70 pl-4 text-[12px] leading-6 text-muted-foreground",
        className,
      )}
      {...props}
    >
      {typeof children === "string" ? (
        <p className="whitespace-pre-wrap">{children}</p>
      ) : (
        children
      )}
    </div>
  );
}
