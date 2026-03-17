# Contributing to CapyFin

Thank you for your interest in contributing to CapyFin! This guide will help you get started.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

### Prerequisites

- **Node.js** 22.18+ (managed via pnpm)
- **pnpm** 10.32+ (`corepack enable` to activate)
- **Rust** toolchain (for Tauri desktop builds)

### Setup

```bash
# Clone the repository
git clone https://github.com/capyfin/capyfin.git
cd capyfin

# Install dependencies
pnpm install

# Run the development server (browser mode)
pnpm dev
```

### Project Structure

```
capyfin/
  apps/
    desktop/       # Tauri + Vite + React desktop app
  packages/
    cli/           # CLI tool
    contracts/     # Shared schemas and types (Zod)
    core/          # Core business logic
    sidecar/       # HTTP server wrapping the agent runtime
  crates/          # Rust modules (Tauri plugins)
  config/          # Shared configuration
  docs/            # Documentation
  scripts/         # Utility scripts
```

## Development Workflow

### Running Checks

```bash
# Run all tests
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format code
pnpm format

# Check formatting without writing
pnpm format:check

# Rust checks
pnpm rust:check
pnpm rust:clippy
pnpm rust:fmt:check
```

### Making Changes

1. **Fork** the repository and create a branch from `main`.
2. **Make your changes** in a focused, well-scoped branch.
3. **Add tests** for any new functionality.
4. **Run checks** locally before submitting:
   ```bash
   pnpm typecheck && pnpm lint && pnpm test
   ```
5. **Commit** with a clear, descriptive message (see below).
6. **Open a pull request** targeting `main`.

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new chat attachment support
fix: resolve session persistence on reload
docs: update contributing guidelines
chore: upgrade dependencies
refactor: simplify gateway client session handling
test: add coverage for session deletion
```

- Use the imperative mood ("add feature" not "added feature").
- Keep the first line under 72 characters.
- Reference issues when applicable: `fix: resolve crash on startup (#42)`.

## Pull Requests

- Keep PRs focused on a single concern.
- Include a clear description of **what** changed and **why**.
- Ensure CI passes before requesting review.
- Be responsive to feedback during code review.

## Reporting Issues

- Use [GitHub Issues](https://github.com/capyfin/capyfin/issues) to report bugs or request features.
- Search existing issues first to avoid duplicates.
- Include reproduction steps, expected behavior, and environment details for bugs.

## License

By contributing to CapyFin, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE).
