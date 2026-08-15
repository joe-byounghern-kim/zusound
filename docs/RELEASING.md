# Releasing ZuSound

## Required configuration

- GitHub environment: `npm-publish`, restricted to `main`
- Workflow: `.github/workflows/release.yml`
- Workflow permission: `id-token: write`
- npm trusted publisher mapping for repository `joe-byounghern-kim/zusound`, workflow `release.yml`, branch `main`, environment `npm-publish`
- Optional fallback secret: `NPM_TOKEN`

Local or manual `pnpm version-packages` runs use `@changesets/changelog-github` and require a `GITHUB_TOKEN` environment variable. Do not store it in a committed file. GitHub reserves the `GITHUB_` secret prefix; if a future Actions versioning job needs a PAT override, store it as `CHANGESETS_GITHUB_TOKEN` and map that secret to `GITHUB_TOKEN` for the versioning step. The current tag-only release workflow does not run `changeset version`.

## Preflight

```bash
pnpm verify
pnpm release:auto:dry-run
```

Confirm CI quality, package validation, Zustand compatibility, release check, and demo deployment checks are green.

## Prepare a version

Version changes happen on a development branch and are reviewed before tagging. Add a Changeset for user-visible package changes:

```bash
pnpm changeset
```

When a maintainer is ready to apply pending Changesets locally, export a suitable GitHub token in the shell and run:

```bash
: "${GITHUB_TOKEN:?Export a GitHub token for Changesets changelog generation}"
pnpm version-packages
pnpm install
pnpm readme:sync
pnpm verify
git status --short
```

Review and commit the version, changelog, manifest, and lockfile changes through the normal pull-request flow. Do not tag from an uncommitted or unreviewed versioning result.

## Release

1. Merge the reviewed release commit to `main`.
2. Fetch and fast-forward the local `main` branch to the exact remote commit that will be tagged:

   ```bash
   git fetch --prune --tags origin main
   git switch main
   git pull --ff-only origin main
   test "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)"
   test -z "$(git status --porcelain)"
   VERSION=$(node -p "require('./packages/zusound/package.json').version")
   test -n "$VERSION"
   git tag "v$VERSION"
   git push origin "v$VERSION"
   ```

3. Verify the `Release` workflow publishes npm provenance and creates the GitHub release.
4. Confirm `npm view zusound version` returns the released version.

The release workflow validates tag format, tag ancestry from `main`, tag/package-version equality, and whether npm/GitHub already contain the release.

## Authentication fallback

If trusted publishing fails, run `Release` through `workflow_dispatch` with the existing tag and `auth_mode=token`; ensure `NPM_TOKEN` is configured first.

## Rollback

Prefer a corrective patch release. If a bad version must be discouraged immediately:

```bash
: "${BAD_VERSION:?Set BAD_VERSION to the version to deprecate}"
: "${CORRECTIVE_VERSION:?Set CORRECTIVE_VERSION to the replacement version}"
npm deprecate "zusound@$BAD_VERSION" "Deprecated: use $CORRECTIVE_VERSION"
```

For demo rollback, rerun the last known-good `Deploy Demo to GitHub Pages` workflow.

## Troubleshooting

- README drift: run `pnpm readme:sync && pnpm docs:check`.
- Skill validation failure: fix skill frontmatter, structure, or local links, then rerun `pnpm skills:validate`.
- Package validation failure: rebuild and run `pnpm package:check` before tagging.
