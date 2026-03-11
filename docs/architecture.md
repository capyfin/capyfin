# Architecture

## Goals

- Support a large team without turning the repository into a flat collection of unrelated files.
- Keep business logic easy to move into shared packages when the app grows.
- Maintain a minimal Tauri security surface by only enabling capabilities and plugins that are actively used.

## Frontend boundaries

- `src/app`: composition root, providers, and startup concerns.
- `src/features`: user-facing product slices. Each feature owns its components, hooks, and tests.
- `src/shared`: reusable UI, config, styles, and low-level helpers that do not encode product workflows.

This keeps features from importing each other arbitrarily and gives reviewers a clear ownership model.

## Rust boundaries

- `crates/capyfin-core`: shared application services and contracts used by every Rust surface.
- `crates/capyfin-cli`: command-line entrypoint for operators, scripts, and local workflows.
- `apps/desktop/src-tauri`: Tauri desktop runtime that adapts frontend commands onto the shared core.

This keeps product logic out of shell-specific entrypoints and makes the desktop runtime and CLI converge on the same behavior instead of drifting.

## Operating conventions

- The root workspace owns shared tooling and task orchestration.
- TypeScript stays in strict mode with type-aware ESLint rules.
- Rust formatting and Clippy warnings are treated as part of the normal build hygiene.
- New plugins and permissions should be added only when required by a feature, then documented in the same pull request.
