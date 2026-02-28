# Runbook

Operational runbook synced from root `package.json` scripts and `.env.example`.

## Environment Prerequisites

Source-of-truth: `.env.example`

- Required variables: none.
- Variable format for future additions: `KEY=value`.

Release publishing prerequisites are configured in GitHub/npm settings and documented in `docs/RELEASE_GATES.md`.

## Deployment Procedures

### Package release (npm)

1. Run preflight quality gates before merging into `main`:

```bash
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm build
```

1.5 Validate README sync guardrails:

```bash
pnpm readme:sync
pnpm readme:check
```

1.6 Validate release gates from `docs/RELEASE_GATES.md` before continuing.

2. Merge `dev` into `main`.

3. Create and push release tag from latest `main` commit:

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
VERSION=$(node -e "console.log(JSON.parse(require('node:fs').readFileSync('packages/zusound/package.json','utf8')).version)")
git tag "v${VERSION}"
git push origin "v${VERSION}"
```

4. Verify release outcomes:

- `Release` workflow in `.github/workflows/release.yml` is green for the tag run.
- Published package version is visible on npm.

4. API docs drift audit before release/demo deploy:

- Run `docs/QA_CHECKLIST.md` section "API Docs Drift Audit (Release/PR)".
- If drift is found, update `demo/index.html` and strategy docs in the same PR before release.

### Demo deployment (GitHub Pages)

Primary deployment is automated by `.github/workflows/deploy-demo.yml`.

Manual fallback path:

```bash
pnpm demo:stage:clean
pnpm demo:stage
pnpm demo:verify
pnpm demo:preview
```

If preview/verification is good, trigger `Deploy Demo to GitHub Pages` with `workflow_dispatch`.

## Monitoring and Alerts

This repository has no runtime alerting service.

Monitoring signals for operations:

- CI failures in `.github/workflows/ci.yml`.
- Demo deploy failures in `.github/workflows/deploy-demo.yml`.
- `Release` workflow publish/auth failures.
- `pnpm demo:verify` stage validation failures.

## Common Issues and Fixes

### `Release` workflow fails

- Symptom: automated publish/auth/version step fails in GitHub Actions.
- Fix:
  1. Re-run preflight (`lint`, `typecheck`, `test`, `build`) on the tagged commit.
  2. Confirm release tag points to a commit reachable from `main`.
  3. Confirm npm trusted publisher mapping (`repo`, workflow path, branch, environment) matches `docs/RELEASE_GATES.md`.
  4. If OIDC still fails, re-run `Release` with `workflow_dispatch` using `tag=vX.Y.Z` and `auth_mode=token`.

### `pnpm readme:check` fails

- Symptom: README drift detected between `packages/zusound/README.md` and managed root README sections.
- Fix:
  1. Run `pnpm readme:sync`.
  2. Re-run `pnpm readme:check`.
  3. Confirm only expected README sections changed, then continue release flow.

### Demo staging fails

- Symptom: `pnpm demo:stage` or `pnpm demo:verify` returns non-zero.
- Fix:
  1. Run `pnpm demo:stage:clean`.
  2. Re-run `pnpm demo:stage`.
  3. Re-run `pnpm demo:verify`.

### Preview does not match expected demo

- Symptom: staged site loads but behavior/assets are wrong.
- Fix:
  1. Run `pnpm demo:stage:clean`.
  2. Run `pnpm build`.
  3. Run `pnpm demo:stage && pnpm demo:verify`.
  4. Preview again via `pnpm demo:preview`.

## Rollback Procedures

### Package rollback

Preferred rollback strategy is a fast corrective patch release.

```bash
git checkout dev
# apply fix
git commit -m "fix: <rollback fix>"
git push origin dev
# merge dev -> main to trigger automated release
```

If a bad version must be discouraged immediately:

```bash
npm deprecate zusound@<bad-version> "Deprecated: use <good-version>"
```

### Demo rollback

1. Open GitHub Actions and locate the last successful `Deploy Demo to GitHub Pages` run.
2. Re-run that workflow to restore the known-good artifact.
3. If needed, pause deploys by updating `.github/workflows/deploy-demo.yml` in a hotfix PR.
