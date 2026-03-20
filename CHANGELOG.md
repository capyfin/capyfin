# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2026-03-20

### Added

- **Curated financial research agent.** Five bundled financial skills (stock analysis, portfolio analyzer, earnings summary, market screener, market overview) are automatically installed into the agent workspace on bootstrap. The agent's SOUL template is tuned for data-driven financial research with portfolio awareness.
- **Portfolio upload in onboarding.** New third step in the onboarding flow lets users upload a CSV of their holdings. The agent reads the portfolio file for personalized analysis. Supports drag-and-drop, file validation (CSV format, 1 MB limit), and a success state showing row count.
- **Portfolio REST API.** POST/GET/DELETE endpoints for managing portfolio CSV files in the agent workspace, with Zod validation, size limits, and automatic USER.md cross-referencing.
- **Portfolio-aware chat experience.** Starter prompts adapt based on whether a portfolio is uploaded (portfolio analysis prompts vs. general market prompts). A portfolio badge appears in the chat header when holdings are loaded.
- **Financial disclaimer.** Persistent disclaimer below the chat input: "Not financial advice. AI-generated analysis may contain errors."
- **Financial tool name humanization.** Chat activity labels display friendly noun-form names (e.g., "Using Stock analysis", "Using Portfolio analysis") instead of raw tool IDs.

### Changed

- **Three-step onboarding flow.** Onboarding now walks through providers → configure → portfolio upload before reaching chat. An `onboardingActive` state flag prevents the flow from short-circuiting when a provider connects mid-onboarding.

### Fixed

- **Onboarding skipped steps 2 and 3.** When a provider connected during onboarding, the app immediately jumped to chat because `!authOverview?.selectedProviderId` became false. Fixed with an explicit `onboardingActive` flag that keeps the ConnectionCenter mounted until the user completes all steps.
