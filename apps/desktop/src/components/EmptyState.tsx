import type { ComponentType, ReactNode } from "react";

export const COLOR_VARIANTS = {
  emerald: {
    glow: "bg-emerald-500/[0.06] blur-xl dark:bg-emerald-500/[0.08]",
    container:
      "border-emerald-500/20 bg-emerald-500/[0.08] dark:bg-emerald-500/[0.1]",
    icon: "text-emerald-500",
  },
  violet: {
    glow: "bg-violet-500/[0.06] blur-xl dark:bg-violet-500/[0.08]",
    container:
      "border-violet-500/20 bg-violet-500/[0.08] dark:bg-violet-500/[0.1]",
    icon: "text-violet-500",
  },
  blue: {
    glow: "bg-blue-500/[0.06] blur-xl dark:bg-blue-500/[0.08]",
    container: "border-blue-500/20 bg-blue-500/[0.08] dark:bg-blue-500/[0.1]",
    icon: "text-blue-500",
  },
  amber: {
    glow: "bg-amber-500/[0.06] blur-xl dark:bg-amber-500/[0.08]",
    container:
      "border-amber-500/20 bg-amber-500/[0.08] dark:bg-amber-500/[0.1]",
    icon: "text-amber-500",
  },
} as const;

export type EmptyStateColor = keyof typeof COLOR_VARIANTS;

interface EmptyStateProps {
  icon: ComponentType<{ className?: string }>;
  iconColor: EmptyStateColor;
  heading: string;
  description: string;
  className?: string;
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  iconColor,
  heading,
  description,
  className = "flex flex-1 flex-col items-center justify-center gap-5 py-20",
  children,
}: EmptyStateProps) {
  const colors = COLOR_VARIANTS[iconColor];

  return (
    <div className={className}>
      <div className="relative">
        <div className={`absolute -inset-3 rounded-2xl ${colors.glow}`} />
        <div
          className={`relative flex size-14 items-center justify-center rounded-2xl border ${colors.container}`}
        >
          <Icon className={`size-6 ${colors.icon}`} />
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-[17px] font-semibold text-foreground">{heading}</h2>
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}
