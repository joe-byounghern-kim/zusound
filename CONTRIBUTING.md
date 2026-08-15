# Contributing to ZuSound

## Prerequisites

- Node.js `>=22.22.2`
- Node.js `24.19.0` recommended via `.nvmrc`
- pnpm `11.20.0` through Corepack
- [mise](https://mise.jdx.dev/getting-started.html) for maintainers running the exact Node 22.22.2 and 24.19.0 matrix declared in `.tool-versions`

## Setup

```bash
corepack enable
pnpm install --frozen-lockfile
```

Normal development may use Node 24 through `.nvmrc`. For the full pre-release matrix, install mise and run `mise install` so both exact CI runtimes are reproduced from `.tool-versions`.

ZuSound has no runtime environment variables. Release authentication is configured in GitHub and npm, not in a local `.env` file.

## Development commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm build
pnpm demo:dev
pnpm format:check
pnpm security:check
pnpm deps:check
pnpm docs:check
pnpm skills:validate
pnpm automation:check
pnpm knip
pnpm package:check
pnpm verify
```

## Intentional dependency constraints

- TypeScript stays on `5.9.3` until stable TypeScript ESLint supports TypeScript 7.
- `@types/node` stays on the Node 24 line to match the Node 22/24 CI matrix.
- esbuild is pinned to `0.28.1` in `pnpm-workspace.yaml`; the natural graph resolves vulnerable `0.27.7`, while pnpm's one-day release-age policy excludes a newer same-day release.
- nanoid is pinned to `3.3.18` because the natural PostCSS graph can resolve vulnerable `3.3.16` even after fresh pnpm 11 lockfile generation.

## Pull requests

1. Keep public API and behavioral changes covered by tests.
2. Run `pnpm verify` before requesting review.
3. Update `packages/zusound/README.md` and run `pnpm readme:sync` when public usage or options change.
4. Update `demo/src/sections/ApiDocs.tsx` when public API examples or option tables change.
5. Add a Changeset only when the published `zusound` package needs a release note or version bump.

## Skills

Canonical project skills live under `.agents/skills/`. Run `pnpm skills:validate` after editing them and `pnpm skills:bridge` to regenerate local `.claude/skills/` bridge files.

## Release process

See `docs/RELEASING.md`.
