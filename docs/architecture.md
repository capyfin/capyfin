# Architecture

## Goals

- Support a large team without turning the repository into a flat collection of unrelated files.
- Keep the native shell thin and reserve it for startup, process supervision, and platform APIs.
- Make frontend to backend communication explicit through a stable local HTTP contract.
- Keep the embedded agent runtime internal so the desktop app ships as one install with no user-managed ports, tokens, or CLI setup.
- Maintain a minimal Tauri security surface by only enabling capabilities and plugins that are actively used.

## Workspace boundaries

- `apps/desktop`: React shell, dashboard features, and the sidecar client.
- `apps/desktop/src-tauri`: Tauri bootstrap layer, sidecar supervision, and native capabilities.
- `packages/contracts`: shared transport schemas and the repository manifest.
- `packages/core`: shared Node application core for manifest access, auth/profile management, bootstrap payloads, and CLI-facing helpers.
- `packages/cli`: operational Node CLI surface built on the shared core.
- `packages/sidecar`: Node sidecar API that becomes the main application boundary and supervises the embedded agent runtime.
- `config/app-manifest.json`: cross-language metadata that keeps Rust and TypeScript aligned.

This gives contributors a clear place to add code without forcing product logic into Tauri commands or duplicating transport contracts.

## Bootstrap flow

1. Rust binds `127.0.0.1:0` to reserve a free localhost port.
2. Rust generates a random password and spawns the Node sidecar.
3. Rust polls `GET /global/health` over localhost HTTP with Basic Auth.
4. The frontend asks Tauri for the initialized sidecar connection details.
5. During sidecar startup, Node allocates an internal loopback port, loads or creates a gateway token, writes an app-owned runtime config, and starts the embedded runtime as a child process.
6. The sidecar waits for the embedded runtime readiness probe, then opens its own programmatic client connection.
7. Once initialization is complete, the frontend talks to the sidecar over HTTP instead of pushing product traffic through direct Tauri IPC.

This mirrors the intended long-term shape: Tauri is the secure host, the sidecar is the application server, the embedded runtime is an internal dependency, and the frontend treats the sidecar as its only backend.

## Runtime boundaries

- `packages/core`: shared application behavior and canonical metadata used by both the CLI and sidecar.
- `packages/core/auth`: legacy CLI-only provider auth subsystem retained for scripted workflows while the desktop app migrates to the embedded runtime-backed provider catalog.
- `packages/cli`: command entrypoint for operators and scripted workflows.
- `packages/sidecar`: localhost HTTP server for the desktop shell, plus the embedded runtime supervisor, runtime client, and desktop-owned agent metadata store.

This keeps the runtime behavior aligned across surfaces instead of splitting product logic between Node and Rust.

## Embedded Runtime Model

- The desktop app ships one install. The embedded agent runtime is bundled as an internal dependency and launched by the Node sidecar.
- The sidecar is the only process that talks to the embedded runtime.
- The embedded runtime binds only to `127.0.0.1` on a sidecar-owned dynamic port, with a persisted app-owned token.
- The runtime control UI is disabled and optional browser/channel services are skipped for the desktop embedding mode.
- Runtime config, auth sync files, agent state, sessions, logs, and device identity live under the CapyFin config directory instead of the user shell environment.

## Agent/session model

- Agents are stored in a versioned catalog under the app config directory, with normalized IDs and one protected default agent (`main`).
- Each agent owns an app-managed directory with a workspace folder plus a session area.
- Session metadata is managed through the embedded runtime and mirrored into desktop-facing transport contracts by the sidecar.
- The CLI keeps its own shared agent metadata flow for scripted setup, while the desktop app uses the sidecar-owned embedded runtime adapter.
- Provider auth profiles are synced from the CapyFin auth store into each managed agent directory so runtime turns can resolve credentials without any user shell setup.

## Provider auth model

- The desktop app gets its provider catalog directly from the embedded runtime through the Node sidecar.
- The sidecar discovers supported auth choices at runtime, executes sign-in programmatically, and stores the resulting profiles in the runtime-owned `auth-profiles.json`.
- Provider state lives under the app-managed runtime directories, not in the user shell environment and not in the frontend.
- The frontend only talks to the CapyFin sidecar. It never calls the embedded runtime directly.
- The CLI still exposes its own operator-oriented auth commands for scripted setup, but the desktop UI is driven by the embedded runtime’s supported providers and connection flows.

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
- `packages/core` is the only place where shared Node application behavior for the CLI and sidecar should live.
- Provider auth changes should start in `packages/core/auth`, then be surfaced through CLI commands or sidecar endpoints, rather than implemented separately in each runtime.
- Desktop runtime lifecycle changes should start in `packages/sidecar/src/internal-gateway`, where startup, readiness, auth, and shutdown behavior are centralized.
- `config/app-manifest.json` is the source of truth for shared repository metadata across Rust and TypeScript.
- Rust formatting and Clippy warnings are treated as part of the normal build hygiene.
- New plugins and permissions should be added only when required by a feature, then documented in the same pull request.
- Tauri bundle resources place the prepared sidecar bundle under `sidecar/`, including the packaged Node binary used by the native bootstrap layer.
