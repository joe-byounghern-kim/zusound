# Release Gates

This checklist defines the required repository and registry setup for publishing `zusound` safely.

## Trusted Publishing Requirements

Zusound uses npm trusted publishing through GitHub Actions OIDC.

- GitHub workflow: `.github/workflows/release.yml`
- GitHub environment: `npm-publish`
- GitHub permission required in release job: `id-token: write`
- Default publish auth: OIDC (no token required on normal `main` release runs)
- Optional fallback auth: repository `NPM_TOKEN` secret, used only via manual `workflow_dispatch` (`auth_mode=token`)

Note for local/manual `changeset version` runs: `@changesets/changelog-github` requires `GITHUB_TOKEN` in environment.
GitHub Actions already provides built-in `${{ github.token }}`; you cannot create a secret named `GITHUB_TOKEN` because `GITHUB_` prefix is reserved.
If you need a PAT override, create `CHANGESETS_GITHUB_TOKEN` and the workflow maps it to `GITHUB_TOKEN` automatically.

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

## Pre-Merge Validation

Run and verify all gates before merging `dev` (or feature work) into `main`:

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
- `Release Check` workflow passes `Auto release bump dry-run`

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

## Automated Versioning Policy

Release publish is tag-driven.

- Source of truth for version is `packages/zusound/package.json` on the tagged commit.
- Release trigger is pushing a semver tag `vX.Y.Z`.
- The `Release` workflow validates that the pushed tag exactly matches the package version (`v${package.json version}`).
- The tagged commit must be reachable from `origin/main`.
- If the version is already on npm, publish is skipped safely.

Version bumps happen in normal development/PR flow before tagging. `Release` does not mutate versions.

Manual publish retry is available via `workflow_dispatch` with a required `tag` input (for example `v0.2.3`).

## Release Procedure

1. Merge `dev` into `main`.
2. Create and push the release tag from the `main` commit you want to publish:

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
VERSION=$(node -e "console.log(JSON.parse(require('node:fs').readFileSync('packages/zusound/package.json','utf8')).version)")
git tag "v${VERSION}"
git push origin "v${VERSION}"
```

3. `Release` workflow runs on tag push and will:
   - run quality gates
   - verify tag lineage from `main`
   - verify tag/version match
   - publish to npm (or skip if already published)
4. Verify npm shows the new version.

## Post-Release Validation

- GitHub release workflow run completed successfully
- Published npm package version is visible on npm registry
- Package install smoke-check succeeds:

```bash
npm view zusound version
```

## Auth Failure Fallback

If OIDC trusted publishing fails:

1. Ensure repository secret `NPM_TOKEN` is set (granular publish token).
2. Re-run `Release` using `workflow_dispatch` with:
   - `tag=vX.Y.Z` (the already-created release tag)
   - `auth_mode=token`
