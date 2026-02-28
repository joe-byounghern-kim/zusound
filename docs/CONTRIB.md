# Contributing Guide

This document is synced from root `package.json` scripts and `.env.example`.

## Environment Setup

Source-of-truth: `.env.example`

Current environment variables:

| Variable | Required | Purpose                                                  | Format                            | Default |
| -------- | -------- | -------------------------------------------------------- | --------------------------------- | ------- |
| _none_   | -        | Zusound currently has no required environment variables. | `KEY=value` (if introduced later) | -       |

Notes from `.env.example`:

- Keep `.env.example` as the env source-of-truth.
- If a variable is introduced later, document it here.

Release operations use repository configuration instead of runtime env vars.
See `docs/RELEASE_GATES.md` for required GitHub environment and npm trusted publisher setup.

## Development Workflow

1. Install dependencies:

```bash
pnpm install
```

2. Run quality gates before opening a PR:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

3. For React demo checks:

```bash
pnpm demo:react:typecheck
pnpm demo:react:build
```

4. For demo staging and preview:

```bash
pnpm demo:stage
pnpm demo:verify
pnpm demo:preview
```

## Available Scripts (Root `package.json`)

`package.json` has no script comments, so descriptions below are inferred from script names and commands.

| Script                 | Command                                                  | Description                                    |
| ---------------------- | -------------------------------------------------------- | ---------------------------------------------- |
| `build`                | `turbo run build`                                        | Build all workspace packages/apps.             |
| `build:watch`          | `turbo run build:watch`                                  | Run build watchers across workspaces.          |
| `changeset`            | `changeset`                                              | Create a release changeset.                    |
| `clean`                | `turbo run clean && rm -rf node_modules`                 | Clean workspace outputs and root dependencies. |
| `dev`                  | `turbo run dev`                                          | Run workspace development tasks.               |
| `demo:stage`           | `pnpm build && pnpm -C demo run stage`                   | Build and stage static demo artifact.          |
| `demo:stage:clean`     | `pnpm -C demo run clean-stage`                           | Remove staged demo output.                     |
| `demo:verify`          | `pnpm -C demo run check-stage`                           | Validate staged demo artifact integrity.       |
| `demo:preview`         | `python3 -m http.server 4173 --directory demo/dist-site` | Preview staged demo artifact locally.          |
| `demo:react:dev`       | `pnpm -C examples dev`                                   | Run React TypeScript demo in dev mode.         |
| `demo:react:build`     | `pnpm -C examples build`                                 | Build React TypeScript demo.                   |
| `demo:react:typecheck` | `pnpm -C examples typecheck`                             | Typecheck React TypeScript demo.               |
| `format`               | `prettier --write "**/*.{ts,tsx,js,jsx,json,md,yml}"`    | Format repository files.                       |
| `lint`                 | `turbo run lint`                                         | Run lint tasks across workspaces.              |
| `prepare`              | `husky install`                                          | Install git hooks.                             |
| `release`              | `turbo run build && changeset publish`                   | Build and publish packages.                    |
| `test`                 | `turbo run test`                                         | Run workspace tests.                           |
| `test:coverage`        | `turbo run test:coverage`                                | Run workspace tests with coverage.             |
| `test:watch`           | `turbo run test:watch`                                   | Run tests in watch mode.                       |
| `typecheck`            | `turbo run typecheck`                                    | Run TypeScript checks across workspaces.       |
| `version-packages`     | `changeset version`                                      | Apply version bumps from changesets.           |

## Testing Procedures

- Full repository preflight:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

- Coverage run:

```bash
pnpm test:coverage
```

- Focused package test loop (from root):

```bash
pnpm -C packages/zusound test
pnpm -C packages/zusound test:watch
```

## Demo API Docs Sync Guardrail

- Canonical API ownership is `packages/zusound/src/types.ts` and `packages/zusound/README.md`.
- Demo API docs (`demo/index.html`, `demo/API_DOCS_STRATEGY.md`) must stay synchronized with canonical names, types, defaults, and usage patterns.
- If a PR changes `ZusoundOptions`, `AestheticParams`, `SoundParams`, `Change`, or primary usage examples, update demo API docs in the same PR.
- During review, explicitly confirm: "Demo API docs synchronized with canonical API docs".

## README Sync Before Release Merge

- Canonical source for package-facing docs is `packages/zusound/README.md`.
- Shared sections in root `README.md` are managed by markers and must be synchronized before merging release-bound work into `main`.
- Run the README gate commands before opening or merging a release-impacting PR:

```bash
pnpm readme:sync
pnpm readme:check
```

- If `pnpm readme:check` fails, run `pnpm readme:sync`, stage the README updates, and rerun `pnpm readme:check`.

## Release Workflow

1. Keep daily development on `dev` (or feature branches merged into `dev`).
2. Run preflight checks (`lint`, `typecheck`, `test`, `build`, README sync gate).
3. Merge `dev` into `main`.
4. First `Release` run on `main` performs automated versioning and opens/updates a release PR (`release/vX.Y.Z` -> `main`).
5. Merge the release PR (`chore(release): vX.Y.Z`) into `main`.
6. Second `Release` run on the release commit tags and publishes to npm.

Manual fallback (only when automated OIDC publish fails):

1. Open GitHub Actions `Release` workflow (`workflow_dispatch`).
2. Set `publish_only=true` and `auth_mode=token`.
3. Ensure repository `NPM_TOKEN` secret is configured.

Manual version creation (rare):

1. Open `Release` via `workflow_dispatch`.
2. Set `publish_only=false`.
3. Set `bump` to `patch`, `minor`, or `major`.

Before release, ensure CI quality gates in `.github/workflows/ci.yml` are green.
Also verify repository release gates in `docs/RELEASE_GATES.md`.
