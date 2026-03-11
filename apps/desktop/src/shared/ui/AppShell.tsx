import type { PropsWithChildren } from "react";

type AppShellProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  description: string;
  navigationItems: readonly string[];
}>;

export function AppShell({
  eyebrow,
  title,
  description,
  navigationItems,
  children,
}: AppShellProps) {
  return (
    <main className="shell">
      <div className="shell__frame">
        <header className="shell__nav">
          <strong className="brand">CapyFin</strong>
          <nav aria-label="Primary">
            <ul className="nav-list">
              {navigationItems.map((item) => (
                <li className="nav-pill" key={item}>
                  {item}
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <section className="hero">
          <p className="hero__eyebrow">{eyebrow}</p>
          <h1 className="hero__title">{title}</h1>
          <p className="hero__description">{description}</p>
        </section>

        {children}
      </div>
    </main>
  );
}
