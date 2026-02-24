# Runbook

Operational runbook synced from root `package.json` scripts and `.env.example`.

## Environment Prerequisites

Source-of-truth: `.env.example`

- Required variables: none.
- Variable format for future additions: `KEY=value`.

Release publishing prerequisites are configured in GitHub/npm settings and documented in `docs/RELEASE_GATES.md`.

## Deployment Procedures

### Package release (npm)

1. Run preflight quality gates:

```bash
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm build
```

1.5 Validate release gates from `docs/RELEASE_GATES.md` before continuing.

2. Create and apply release versions:

```bash
pnpm changeset
pnpm version-packages
pnpm release
```

3. Verify release outcomes:

- CI in `.github/workflows/ci.yml` is green.
- Published package version is visible on npm.

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
- `pnpm release` publish/auth failures.
- `pnpm demo:verify` stage validation failures.

## Common Issues and Fixes

### `pnpm release` fails

- Symptom: publish/auth/version command fails.
- Fix:
  1. Re-run preflight (`lint`, `typecheck`, `test`, `build`).
  2. Confirm npm credentials/permissions.
  3. Retry `pnpm release`.

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
pnpm changeset
pnpm version-packages
pnpm release
```

If a bad version must be discouraged immediately:

```bash
npm deprecate zusound@<bad-version> "Deprecated: use <good-version>"
```

### Demo rollback

1. Open GitHub Actions and locate the last successful `Deploy Demo to GitHub Pages` run.
2. Re-run that workflow to restore the known-good artifact.
3. If needed, pause deploys by updating `.github/workflows/deploy-demo.yml` in a hotfix PR.
