# Architecture

## Goals

- Support a large team without turning the repository into a flat collection of unrelated files.
- Keep the native shell thin and reserve it for startup, process supervision, and platform APIs.
- Make frontend to backend communication explicit through a stable local HTTP contract.
- Maintain a minimal Tauri security surface by only enabling capabilities and plugins that are actively used.

## Workspace boundaries

- `apps/desktop`: React shell, dashboard features, and the sidecar client.
- `apps/desktop/src-tauri`: Tauri bootstrap layer, sidecar supervision, and native capabilities.
- `packages/contracts`: shared transport schemas and the repository manifest.
- `packages/sidecar`: Node sidecar API that becomes the main application boundary.
- `crates/capyfin-core`: shared Rust core for native services and the CLI.
- `crates/capyfin-cli`: operational CLI built on the Rust core.
- `config/app-manifest.json`: cross-language metadata that keeps Rust and TypeScript aligned.

This gives contributors a clear place to add code without forcing product logic into Tauri commands or duplicating transport contracts.

## Bootstrap flow

1. Rust binds `127.0.0.1:0` to reserve a free localhost port.
2. Rust generates a random password and spawns the Node sidecar.
3. Rust polls `GET /global/health` over localhost HTTP with Basic Auth.
4. The frontend asks Tauri for the initialized sidecar connection details.
5. Once initialization is complete, the frontend talks to the sidecar over HTTP instead of pushing product traffic through direct Tauri IPC.

This mirrors the intended long-term shape: Tauri is the secure host, the sidecar is the application server, and the frontend treats it as its backend.

## Frontend boundaries

- `src/app`: composition root and shell startup.
- `src/features`: user-facing finance features, grouped by product slice.
- `src/shared`: low-level UI primitives, styles, and non-product helpers.
- `src/lib/sidecar`: transport code for authenticated localhost HTTP calls.

Feature modules should depend on the sidecar client or higher-level adapters, not on raw Tauri commands.

## Native boundaries

- `commands/app.rs`: narrow native commands that are still worth exposing directly.
- `commands/bootstrap.rs`: initialization and sidecar lifecycle commands.
- `sidecar.rs`: process launching, logging, health checks, and shutdown.
- `state.rs`: shared native state for bootstrap progress and sidecar handles.

This keeps startup concerns centralized and prevents ad hoc process management from spreading through the Tauri layer.

## Operating conventions

- The root workspace owns shared tooling and task orchestration.
- TypeScript stays in strict mode with type-aware ESLint rules.
- `packages/contracts` is the only place where frontend and sidecar transport types should be defined.
- `config/app-manifest.json` is the source of truth for shared repository metadata across Rust and TypeScript.
- Rust formatting and Clippy warnings are treated as part of the normal build hygiene.
- New plugins and permissions should be added only when required by a feature, then documented in the same pull request.
- Tauri bundle resources place the built sidecar at `sidecar/dist/cli.js`, matching the runtime lookup path used by the native bootstrap layer.
