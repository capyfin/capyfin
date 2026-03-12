# CapyFin

CapyFin is a sidecar-first Tauri desktop application scaffolded for long-term team ownership. The repository is split into a React desktop shell, a Rust native bootstrap layer, a Node application core, a Node sidecar API, and a Node CLI so additional finance workflows can be added without collapsing everything into one runtime.

## Workspace layout

- `apps/desktop`: React desktop shell and the Tauri runtime.
- `packages/contracts`: shared TypeScript transport schemas and the application manifest.
- `packages/core`: shared Node application core consumed by the sidecar and CLI.
- `packages/cli`: operational Node CLI built on the shared application core.
- `packages/sidecar`: Node sidecar API for localhost HTTP, health checks, and streaming.
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
pnpm cli -- auth providers
pnpm cli -- auth status --output json
```

Provider credentials are managed through the CLI and stored in a versioned auth store under the user config directory, or at `CAPYFIN_AUTH_STORE_PATH` when an explicit path is provided. Shared auth behavior lives behind the Node-only `@capyfin/core/auth` entrypoint so the CLI and future sidecar workflows resolve providers through the same rules.

## Quality gates

```bash
pnpm test
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
- Keep shared application logic in `packages/core`, then have the sidecar and CLI consume it.
- Keep shared contracts in one place so frontend and sidecar changes cannot drift silently.
- Default to strict static analysis so regressions are caught before review.
- Add new surface area behind modules, not ad hoc files at the repo root.

More detail is in [docs/architecture.md](/Users/marian2js/workspace/capyfin/docs/architecture.md).
