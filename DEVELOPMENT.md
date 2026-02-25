# Development Guide

This guide describes the local workflow for contributing to Zusound.

## Prerequisites

- Node.js `>= 18`
- `pnpm` (workspace uses `pnpm@8.14.1`)

## Install

From repository root:

```bash
pnpm install
```

## Common Commands

### Root workspace

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

### Package-scoped (`packages/zusound`)

```bash
pnpm -C packages/zusound lint
pnpm -C packages/zusound typecheck
pnpm -C packages/zusound test -- --run
pnpm -C packages/zusound build
```

## Demo Workflow

Build the package first, then start the demo server:

```bash
pnpm build
node demo/server.js
```

Open `http://localhost:3000`.

To validate the hosted/static artifact locally:

```bash
pnpm demo:stage
pnpm demo:verify
pnpm demo:preview
```

Open `http://localhost:4173`.

## React TypeScript Demo (strict)

Use the framework-focused demo to verify strict TypeScript integration:

```bash
pnpm demo:react:typecheck
pnpm demo:react:dev
```

Open `http://localhost:5173`.

## Testing Notes

- Unit tests are in `packages/zusound/__tests__` and run with Vitest.
- Web Audio behavior is tested using mocks in package tests.
- If you update audio behavior or options, update tests in the same change.

## Release Preflight

Run before creating a release changeset:

```bash
pnpm readme:sync
pnpm readme:check
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm build
```

Before publish, ensure release gate prerequisites are configured (GitHub `npm-publish` environment + npm trusted publisher mapping): `docs/RELEASE_GATES.md`.

## Related Docs

- Quick start: `QUICK_START.md`
- Contributor workflow: `docs/CONTRIB.md`
- Runbook: `docs/RUNBOOK.md`
- Release gates: `docs/RELEASE_GATES.md`
