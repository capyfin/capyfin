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
- `packages/core`: shared Node application core for manifest access, auth/profile management, bootstrap payloads, and CLI-facing helpers.
- `packages/core/agents`: agent catalog, session metadata, filesystem layout, and transcript creation.
- `packages/cli`: operational Node CLI surface built on the shared core.
- `packages/sidecar`: Node sidecar API that becomes the main application boundary.
- `config/app-manifest.json`: cross-language metadata that keeps Rust and TypeScript aligned.

This gives contributors a clear place to add code without forcing product logic into Tauri commands or duplicating transport contracts.

## Bootstrap flow

1. Rust binds `127.0.0.1:0` to reserve a free localhost port.
2. Rust generates a random password and spawns the Node sidecar.
3. Rust polls `GET /global/health` over localhost HTTP with Basic Auth.
4. The frontend asks Tauri for the initialized sidecar connection details.
5. Once initialization is complete, the frontend talks to the sidecar over HTTP instead of pushing product traffic through direct Tauri IPC.

This mirrors the intended long-term shape: Tauri is the secure host, the sidecar is the application server, and the frontend treats it as its backend.

## Runtime boundaries

- `packages/core`: shared application behavior and canonical metadata used by both the CLI and sidecar.
- `packages/core/auth`: Node-only provider auth subsystem for provider definitions, credential profile storage, selection rules, and environment fallback.
- `packages/core/agents`: Node-only agent/session subsystem for normalized agent IDs, default-agent handling, agent stores, and session transcript creation.
- `packages/cli`: command entrypoint for operators and scripted workflows.
- `packages/sidecar`: localhost HTTP server for the desktop shell, built on the same core package.

This keeps the runtime behavior aligned across surfaces instead of splitting product logic between Node and Rust.

## Agent/session model

- Agents are stored in a versioned catalog under the app config directory, with normalized IDs and one protected default agent (`main`).
- Each agent owns an app-managed directory with a workspace folder plus a session area.
- Session metadata is tracked in a lightweight JSON index per agent.
- Session transcripts are not custom JSON invented in CapyFin. They use `@mariozechner/pi-coding-agent`'s `SessionManager`, which gives us a durable append-only transcript format that can later be consumed by richer agent runtimes without migration.
- The CLI and sidecar both call the same `AgentService`, so agent CRUD, default-agent rules, session keying, and transcript creation cannot drift across surfaces.

## Provider auth model

- Provider auth lives in shared Node core, not in Rust and not directly in the CLI.
- The CLI is the operator surface for login, selection, and status. It does not own provider resolution rules.
- Auth state is stored in a versioned `auth-profiles.json` file under the user config directory, with optional override through `CAPYFIN_AUTH_STORE_PATH` for tests and isolated automation.
- The auth store keeps three concepts explicit:
  - Stored credential profiles keyed by provider and profile label.
  - Per-provider profile ordering for deterministic resolution.
  - Current selection through `activeProviderId` and `activeProfileId`.
- Provider definitions are curated in core and enriched from the `pi-ai` OAuth registry so OAuth-capable providers and static-secret providers are surfaced through one catalog.
- Environment credentials remain first-class. A provider can be selected from environment state even when no profile has been persisted, which keeps local development and CI flows scriptable without copying secrets into the auth store.

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
- Agent/session changes should start in `packages/core/agents`, then be surfaced through CLI commands or sidecar endpoints instead of duplicating session rules in multiple runtimes.
- `config/app-manifest.json` is the source of truth for shared repository metadata across Rust and TypeScript.
- Rust formatting and Clippy warnings are treated as part of the normal build hygiene.
- New plugins and permissions should be added only when required by a feature, then documented in the same pull request.
- Tauri bundle resources place the built sidecar at `sidecar/dist/cli.js`, matching the runtime lookup path used by the native bootstrap layer.
