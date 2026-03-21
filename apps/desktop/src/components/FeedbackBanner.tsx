import { cn } from "@/lib/utils";

interface FeedbackBannerProps {
  children: string;
  tone: "error" | "success";
}

export function FeedbackBanner({ children, tone }: FeedbackBannerProps) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3.5 py-2.5 text-[13px]",
        tone === "error"
          ? "border-warning/20 bg-warning/8 text-warning-foreground"
          : "border-success/20 bg-success/8 text-success",
      )}
    >
      {children}
    </div>
  );
}
