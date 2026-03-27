# Releases

CapyFin desktop releases are versioned from the root [`VERSION`](../VERSION) file.

## What ships

The release workflow publishes:

- macOS desktop bundles for Apple Silicon as `.app` and `.dmg`
- Windows desktop installers as `.msi` and NSIS `.exe`

The workflow is defined in [`/.github/workflows/release.yml`](../.github/workflows/release.yml).

## How to cut a release

Use GitHub Actions and run the `Release` workflow manually.

Inputs:

- `version`: semantic version without the `v` prefix, for example `0.2.0`
- `prerelease`: set to `true` when publishing a prerelease

The workflow will:

1. Synchronize every app and package version to match `VERSION`
2. Commit the version bump as `chore(release): cut vX.Y.Z`
3. Create and push the `vX.Y.Z` tag
4. Create the GitHub release
5. Build macOS and Windows desktop bundles
6. Upload the generated installers to that release

The manual workflow expects a fresh version. If `vX.Y.Z` already exists on the remote, it fails instead of rebuilding an older tagged revision.

You can also trigger the workflow by pushing a `vX.Y.Z` tag yourself. In that case the workflow uses the versions already committed in the tagged revision.

## Repository prerequisites

- GitHub Actions must have `Read and write permissions` so the workflow can push the release commit and tag with `GITHUB_TOKEN`
- If your default branch is protected, GitHub Actions must be allowed to push the automated `chore(release): cut vX.Y.Z` commit, or you should cut releases from an unprotected release branch
- The hosted runners must stay enabled for both `macos-latest` and `windows-latest`

## Signing

Local macOS builds use Tauri's ad-hoc signing identity (`-`) by default. That is suitable for internal testing only.

For production distribution outside internal testing, add platform signing credentials before broad release:

- macOS: Developer ID Application certificate and notarization credentials
- Windows: code-signing certificate

When Apple signing credentials are configured in GitHub Actions, the release workflow passes them through automatically.

Configure these GitHub Actions secrets when you want notarized macOS releases:

- `APPLE_CERTIFICATE`
- `APPLE_CERTIFICATE_PASSWORD`
- `APPLE_ID`
- `APPLE_PASSWORD`
- `APPLE_TEAM_ID`

Optional when the certificate imports multiple identities:

- `APPLE_SIGNING_IDENTITY`

Production baseline:

- macOS: Developer ID signed and notarized
- Windows: code-signed installers
