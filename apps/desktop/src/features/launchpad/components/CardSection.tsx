import type { ReactNode } from "react";

interface CardSectionProps {
  title: string;
  children: ReactNode;
}

export function CardSection({ title, children }: CardSectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 [&>*:last-child:nth-child(odd)]:sm:col-span-2">
        {children}
      </div>
    </section>
  );
}
