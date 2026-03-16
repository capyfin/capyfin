import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ShimmerProps extends HTMLAttributes<HTMLSpanElement> {
  children: string;
}

export function Shimmer({ children, className, ...props }: ShimmerProps) {
  return (
    <span
      className={cn("inline-flex animate-pulse text-inherit", className)}
      {...props}
    >
      {children}
    </span>
  );
}
