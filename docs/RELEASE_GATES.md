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

Release flow is fully automated on `main` and does not require manual changeset authoring.

- Version bump source: commit messages since last tag
- `major`: commit body contains `BREAKING CHANGE` or subject uses `!:`
- `minor`: commit subject matches `feat(...)` or `feat:`
- `patch`: everything else
- Target package: `zusound`
- Ignored package: `zusound-react-ts-demo` (configured in `.changeset/config.json`)

Manual override is available only when needed via `Release` workflow dispatch input `bump` (`patch`, `minor`, `major`).

Manual dispatch defaults to `publish_only=true` to avoid accidental no-change version bumps.
If you intentionally want to create a new release version from manual dispatch, set `publish_only=false` and provide `bump`.

## Release Procedure

1. Merge `dev` into `main`.
2. `Release` workflow runs on that `main` push and will:
   - run quality gates
   - generate an automatic changeset for `zusound`
   - run `changeset version`
   - apply freshness guard (skip stale runs)
   - create/update a `release/vX.Y.Z` branch and open/update a release PR to `main`
3. Merge the release PR (`chore(release): vX.Y.Z`) into `main`.
4. `Release` workflow runs again on the merged release commit and will:
   - ensure tag `vX.Y.Z` exists
   - publish to npm
5. Verify npm shows the new version.

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
   - `publish_only=true`
   - `auth_mode=token`
