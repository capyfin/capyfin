interface AppMetadata {
  productName: string;
  workspaceLayout: string[];
}

const pillars = [
  {
    title: "App shell",
    description:
      "Routing, global providers, and startup behavior stay under src/app so feature work does not leak into bootstrap code.",
  },
  {
    title: "Feature slices",
    description:
      "Product areas belong in src/features with their own components and tests, which keeps review scope and ownership obvious.",
  },
  {
    title: "Rust runtime",
    description:
      "Commands and process state are separated before feature code arrives, so native integration can scale without a monolithic lib.rs.",
  },
];

interface OverviewSectionProps {
  metadata: AppMetadata;
}

export function OverviewSection({ metadata }: OverviewSectionProps) {
  return (
    <section className="panel-grid" aria-label="Architecture highlights">
      {pillars.map((pillar) => (
        <article className="panel" key={pillar.title}>
          <p className="panel-label">{pillar.title}</p>
          <p className="panel-copy">{pillar.description}</p>
        </article>
      ))}

      <article className="panel">
        <p className="panel-label">Live runtime metadata</p>
        <p className="panel-copy">
          {metadata.productName} currently exposes the repo seams below from the
          Rust process.
        </p>
        <ul className="panel-list">
          {metadata.workspaceLayout.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>
    </section>
  );
}
