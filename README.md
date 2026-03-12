# CapyFin

CapyFin is a sidecar-first Tauri desktop application scaffolded for long-term team ownership. The repository is split into a React desktop shell, a Rust native bootstrap layer, a Node sidecar API, and shared contracts so additional finance workflows can be added without collapsing everything into one runtime.

## Workspace layout

- `apps/desktop`: React desktop shell and the Tauri runtime.
- `packages/contracts`: shared TypeScript transport schemas and the application manifest.
- `packages/sidecar`: Node sidecar API for localhost HTTP, health checks, and streaming.
- `crates/capyfin-core`: shared Rust core for native runtime services and the CLI.
- `crates/capyfin-cli`: operational CLI built on the shared Rust core.
- `config/app-manifest.json`: cross-language manifest consumed by both Rust and TypeScript.
- `docs`: lightweight engineering documentation for architecture and conventions.

## Getting started

```bash
pnpm install
pnpm desktop:dev
```

For frontend-only iteration:

```bash
pnpm dev
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
pnpm build
pnpm format:check
pnpm rust:fmt:check
pnpm rust:clippy
cargo test --workspace
```

## Principles

- Keep the desktop runtime thin: Rust owns startup, credentials, ports, and native capabilities, not day-to-day product traffic.
- Route normal app communication through the localhost sidecar so the frontend and backend evolve behind a stable HTTP boundary.
- Keep Rust business logic in `capyfin-core`, then have desktop and CLI entrypoints consume it.
- Keep shared contracts in one place so frontend and sidecar changes cannot drift silently.
- Default to strict static analysis so regressions are caught before review.
- Add new surface area behind modules, not ad hoc files at the repo root.

More detail is in [docs/architecture.md](/Users/marian2js/workspace/capyfin/docs/architecture.md).
