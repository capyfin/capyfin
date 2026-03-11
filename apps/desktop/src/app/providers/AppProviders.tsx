import type { PropsWithChildren } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: PropsWithChildren) {
  return <TooltipProvider delayDuration={150}>{children}</TooltipProvider>;
}
