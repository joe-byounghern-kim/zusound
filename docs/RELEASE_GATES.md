# Release Gates

This checklist defines the required repository and registry setup for publishing `zusound` safely.

## Trusted Publishing Requirements

Zusound uses npm trusted publishing through GitHub Actions OIDC.

- GitHub workflow: `.github/workflows/release.yml`
- GitHub environment: `npm-publish`
- GitHub permission required in release job: `id-token: write`
- npm token requirement: no `NPM_TOKEN` secret is required for publish

## GitHub Environment Setup

Configure the `npm-publish` environment in repository settings.

- Add protection rules (required reviewers recommended)
- Restrict deployment branches to `main`
- Keep environment-level secrets minimal (none required for npm publish path)

## npm Trusted Publisher Setup

In npm package settings for `zusound`, add a trusted publisher mapping for this repository/workflow.

- Repository: `joe-byounghern-kim/zusound`
- Workflow file: `.github/workflows/release.yml`
- Branch: `main`
- Environment name: `npm-publish`

## Pre-Release Validation

Run and verify all gates locally before triggering release:

```bash
pnpm readme:sync
pnpm readme:check
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm build
```

Then confirm CI status:

- `quality` job is green
- `zustand-compat` matrix is green for oldest `4.x`, latest `4.x`, and latest `5.x`
- `Release Check` workflow passes `README sync check`

## README Sync Gate (Package -> Root)

- Canonical package-facing README: `packages/zusound/README.md`
- Root `README.md` includes sync-managed sections with `README_SYNC:SECTION_START/END:<id>` markers.
- Guardrail command: `pnpm readme:check`.
- If guardrail fails, remediation is always:

```bash
pnpm readme:sync
pnpm readme:check
```

- Release-related workflows (`release-check.yml`, `release.yml`) run `pnpm readme:check` before changeset/publish steps.

## Release Procedure

```bash
pnpm readme:sync
pnpm readme:check
pnpm changeset
pnpm version-packages
pnpm release
```

## Post-Release Validation

- GitHub release workflow run completed successfully
- Published npm package version is visible on npm registry
- Package install smoke-check succeeds:

```bash
npm view zusound version
```
