# TODOS

## P2: App.tsx State Management Refactor

Extract App.tsx's 10+ useState hooks into a reducer or context. The component is the most-touched file (19 changes in 30 days) and onboarding state will increase complexity further.

- Effort: S with CC (~30 min)
- Depends on: Nothing — can be done anytime
- Context: App.tsx manages auth, client, loading, error, view, sessions, and active session state all as individual hooks. A reducer or app-level context would make state transitions explicit and testable.

## P2: Config.ts Type Safety

Replace deeply nested `Record<string, unknown>` casts in `writeEmbeddedGatewayConfig` (packages/sidecar/src/internal-gateway/config.ts lines 90-155) with a typed config builder. Each config section (agents, discovery, gateway, logging) should have a proper interface.

- Effort: S with CC (~15 min)
- Depends on: Nothing — no longer coupled to skill integration (skills are workspace folders, not config)
- Context: The current pattern is fragile. One wrong cast silently drops config keys. Not blocking any feature work, but worth cleaning up.

## P3: ClawHub Dynamic Skill Download

Add ability to download skills from ClawHub registry instead of bundling them statically. Would allow users to install new skills without a Capyfin release.

- Effort: M with CC (~1 hour)
- Depends on: Nothing — curated financial agent shipped in v0.2.0, bundled skills validated
- Context: v0.2.0 bundles skills as static files in the sidecar package. Adding ClawHub download would make the skill ecosystem dynamic. Adds network dependency and error handling complexity.
