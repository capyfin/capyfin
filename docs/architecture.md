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

- `src-tauri/src/commands`: Tauri command handlers exposed to the frontend.
- `src-tauri/src/state.rs`: process-wide application state.
- `src-tauri/src/lib.rs`: composition root for plugins, commands, and state wiring.

The Rust side starts intentionally small, but the module seams are in place before the first real command lands.

## Operating conventions

- The root workspace owns shared tooling and task orchestration.
- TypeScript stays in strict mode with type-aware ESLint rules.
- Rust formatting and Clippy warnings are treated as part of the normal build hygiene.
- New plugins and permissions should be added only when required by a feature, then documented in the same pull request.
