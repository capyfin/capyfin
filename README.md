# CapyFin

CapyFin is a sidecar-first Tauri desktop application scaffolded for long-term team ownership. The repository is split into a React desktop shell, a Rust native bootstrap layer, a Node sidecar API, an embedded local agent runtime managed by that sidecar, and a Node CLI so additional finance workflows can be added without exposing internal runtime setup to end users.

## Financial research agent

CapyFin ships a curated financial research agent with five bundled skills:

- **Stock analysis** — price, fundamentals, news, analyst ratings
- **Portfolio analyzer** — allocation, performance, risk (requires portfolio upload)
- **Earnings summary** — results, guidance, market reaction
- **Market screener** — filter stocks by financial criteria
- **Market overview** — indices, sectors, movers, news

Users upload a portfolio CSV during onboarding (or later) and the agent references their actual holdings for personalized analysis.

## Workspace layout

- `apps/desktop`: React desktop shell and the Tauri runtime.
- `packages/contracts`: shared TypeScript transport schemas and the application manifest.
- `packages/core`: shared manifest/bootstrap utilities and runtime-agnostic helpers.
- `packages/cli`: operational Node CLI built on the embedded runtime adapter.
- `packages/sidecar`: Node sidecar API for localhost HTTP, health checks, streaming, embedded runtime supervision, and bundled financial skills.
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
pnpm cli -- agents list --output json
pnpm cli -- agents create --name "Research" --provider openai --model gpt-5
pnpm cli -- sessions create research --label "Morning brief"
```

Provider credentials, agents, and sessions are managed through the embedded runtime and stored under the CapyFin config directory. The CLI and desktop app both go through the sidecar/runtime integration layer rather than maintaining a separate provider implementation.

On desktop, the sidecar starts and supervises an internal localhost-only agent runtime on demand. The sidecar owns port reservation, token generation, readiness checks, shutdown, and the runtime config/state directories. The frontend still talks only to the CapyFin sidecar. It never talks to the embedded runtime directly.

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
- Keep shared manifest and transport utilities in `packages/core`, and keep provider/agent runtime behavior behind the sidecar-owned embedded runtime adapter.
- Keep shared contracts in one place so frontend and sidecar changes cannot drift silently.
- Default to strict static analysis so regressions are caught before review.
- Add new surface area behind modules, not ad hoc files at the repo root.

More detail is in [docs/architecture.md](/Users/marian2js/workspace/capyfin/docs/architecture.md).
