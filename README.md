# CapyFin

CapyFin is a Tauri desktop application scaffolded for long-term team ownership. This repository starts with a pnpm workspace, a React and TypeScript frontend, and a modular Rust backend so new product areas can be added without rewriting the foundation.

## Workspace layout

- `apps/desktop`: Tauri desktop product, including the Vite frontend and Rust runtime.
- `docs`: lightweight engineering documentation for architecture and conventions.

## Getting started

```bash
pnpm install
pnpm dev
```

For a desktop shell with the Rust process running:

```bash
pnpm desktop:dev
```

For the shared CLI:

```bash
pnpm cli -- metadata
pnpm cli -- workspace --output json
```

## Quality gates

```bash
pnpm lint
pnpm typecheck
pnpm format:check
pnpm rust:fmt:check
pnpm rust:clippy
```

## Principles

- Keep product code under clear boundaries: app shell, features, shared frontend utilities, and Rust commands/state.
- Keep Rust business logic in `capyfin-core`, then have desktop and CLI entrypoints consume it.
- Default to strict static analysis so regressions are caught before review.
- Add new surface area behind modules, not ad hoc files at the repo root.

More detail is in [docs/architecture.md](/Users/marian2js/workspace/capyfin/docs/architecture.md).
