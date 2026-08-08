# Repository Modernization and Consolidation Design

- **Date:** 2026-08-08
- **Status:** Approved
- **Selected approach:** Modernize and consolidate

## Objective

Move ZuSound to the newest mutually compatible stable development stack, eliminate current dependency vulnerabilities, and reduce the repository to one published package, one typed integration demo, concise current documentation, and intentionally retained automation. Preserve the published library API, runtime behavior, and Zustand compatibility range.

## Current Evidence

The design is based on a clean `dev` checkout and fresh local inspection:

- `pnpm readme:check`, skills validation, lint, typecheck, all 102 tests, and both workspace builds pass before modernization.
- `pnpm audit --json` reports one high-severity advisory through `nanoid@3.3.16`.
- `pnpm outdated --recursive` reports several major-version gaps, including ESLint 10, Vite 8, Vitest 4, jsdom 30, Husky 9, lint-staged 17, pnpm 11, and TypeScript 7.
- A literal latest-version sweep is not coherent: stable `@typescript-eslint` 8.66 accepts TypeScript `<6.1`, while the current TypeScript `latest` tag is 7.0.2.
- Latest jsdom and lint-staged require Node 22.22 or newer. pnpm 11 requires Node 22.13 or newer.
- Knip reports unused direct dependencies (`eslint-plugin-react` and `html-encoding-sniffer`), an intentional but misplaced root Zustand dependency used only by the legacy demo, a redundant middleware default export, and unused React-demo exports.
- The repository contains two overlapping demos: a 2,163-line vanilla demo with custom serving/staging/vendoring code and a 1,808-line strict React/Vite demo.
- The root README references a missing `docs/assets/demo-preview.gif`.
- Several documents are completed phase records, rollout rehearsals, duplicated command catalogs, or implementation research rather than current user or contributor documentation.
- `.env.example` claims no environment variables are required but contains a placeholder `GITHUB_TOKEN` assignment.
- `packages/zusound/.npmignore` duplicates the package manifest's `files` allowlist and does not match the observed packed source-map contents.

## Design Principles

1. **Delete before upgrading.** Remove dependencies, files, and workflows that no longer provide enough value to maintain.
2. **Latest coherent stable beats literal latest.** Use the newest stable versions that satisfy each other's documented engines and peer ranges. Do not introduce prereleases merely to satisfy a dist-tag metric.
3. **One canonical surface per responsibility.** Keep one deployable demo, one contributor guide, one release guide, and one concise skill-system guide.
4. **Public compatibility is explicit.** Preserve the package's exports, behavior, zero-runtime-dependency policy, and `zustand >=4 <6` peer contract.
5. **Evidence precedes deletion.** Remove only files or code shown to be redundant, generated, historical, unused, or superseded.
6. **Every maintenance rule has an executable gate.** All deterministic non-interactive dependency, dead-code, documentation, package, and demo checks must run locally and in CI. The final interactive browser smoke check is recorded separately before completion.

## Scope

### Included

- Root, package, demo, package-manager, lockfile, and GitHub Actions dependency modernization.
- Node and pnpm development-floor updates.
- Consolidation of the two demos into one React/Vite demo.
- Removal of confirmed unused dependencies, exports, scripts, generated-publication metadata, and historical documentation.
- Consolidation of contributor, release, QA, and skill-system guidance.
- CI updates, package-tarball validation, dead-code validation, documentation-link validation, and grouped dependency automation.

### Excluded

- Changes to the public `zusound`, `createZusound`, `version`, or exported type APIs.
- Changes to audio synthesis, scheduling, diffing, dissonance, middleware behavior, defaults, or error semantics.
- A package version bump or npm release.
- Expansion of the Zustand peer range beyond `>=4.0.0 <6.0.0`.
- Removal of the four canonical `.agents/skills` user-facing skills.
- A visual redesign of the demo beyond changes required for consolidation and GitHub Pages correctness.

## Target Repository Shape

The maintained product surfaces will be:

```text
.agents/
  README.md
  skills/
.github/
  dependabot.yml
  workflows/
demo/
  src/
  package.json
  README.md
  vite.config.ts
docs/
  RELEASING.md
packages/
  zusound/
    src/
    __tests__/
    package.json
    README.md
    CHANGELOG.md
scripts/
  build-skill-bridge.mjs
  check-docs.mjs
  check-skills.mjs
  create-auto-changeset.mjs
  sync-readme.mjs
CODE_OF_CONDUCT.md
CONTRIBUTING.md
LICENSE
README.md
SECURITY.md
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
tsconfig.json
turbo.json
```

The exact tree may retain standard configuration files not shown above. No second demo, phase log, rehearsal record, or custom local-artifact deletion subsystem remains.

## Compatibility Policy

### Development runtime

- Set `engines.node` to `>=22.22.2`.
- Set `.nvmrc` to the selected Node 24 LTS patch release, at least `24.15.0`.
- Pin the workspace package manager to pnpm `11.20.0`.
- Run full CI quality gates on the minimum supported Node 22.22 line and Node 24 LTS.
- Remove the Node 18 build/test job. Node 18 is end-of-life and blocks current development tools.

### Published package

- Keep build target `ES2020`.
- Keep zero runtime dependencies.
- Keep `zustand >=4.0.0 <6.0.0` as the only peer dependency.
- Keep compatibility validation for oldest supported Zustand 4, latest Zustand 4, and latest Zustand 5.
- Validate the packed artifact as a consumer rather than requiring modern development tools to execute on Node 18.

### Intentional version constraints

- Keep TypeScript on stable 5.9.x until stable `@typescript-eslint` supports TypeScript 7. Do not use a beta, release candidate, canary, or peer override.
- Align `@types/node` with Node 24 instead of installing Node 26 types into a Node 22/24 development matrix.
- Record these short-lived constraints in `CONTRIBUTING.md` under an "Intentional dependency constraints" section.

## Dependency Modernization

### Delete first

Remove these direct dependencies before upgrading:

- Root `eslint-plugin-react`, because the ESLint configuration does not import or use it and its current peer range does not support ESLint 10.
- Package `html-encoding-sniffer`, because it is not imported and creates a second unused copy beside jsdom's real transitive dependency.
- Root `zustand`, after the legacy demo is removed and the consolidated demo owns its dependency directly.

Retain the package's direct Vite dependency and upgrade it to Vite 8 because Vitest 4 declares Vite as a non-optional peer. Configure Knip to recognize this peer-satisfaction dependency as intentional.

Retain and upgrade Husky and lint-staged. Migrate their configuration and hook format to the latest stable supported syntax.

### Upgrade families

Apply upgrades in independently verifiable groups:

1. Node engine, `.nvmrc`, pnpm, and lockfile format.
2. ESLint 10, `@eslint/js`, TypeScript ESLint 8.66, globals, Prettier integration, React Hooks, and React Refresh.
3. Vitest 4, matching coverage provider, jsdom 30, and the resulting supported Vite graph.
4. React demo build stack: Vite 8 and React plugin 6.
5. Husky 9 and lint-staged 17, including hook-format migration.
6. Changesets, Turbo, Prettier, tsup, React types, Zustand development versions, and remaining compatible patch/minor updates.
7. GitHub Actions revisions and package-manager setup consistency.

Regenerate `pnpm-lock.yaml` through pnpm 11. Do not hand-edit resolved entries.

### Overrides and build scripts

- Remove the exact esbuild override if the upgraded graph naturally selects a secure supported release and every build passes.
- Retain an exact override only when a current advisory cannot be resolved by upgrading a direct parent and the selected version satisfies every parent range.
- Keep `esbuild` as the sole explicitly allowed dependency build script.
- Final audit metadata must report zero vulnerabilities at every severity.

## Demo Consolidation

The strict React/Vite application in `examples/` becomes the only demo and integration application.

### Structural changes

- Delete the legacy vanilla `demo/` implementation.
- Move or rename `examples/` to `demo/` after the old directory is removed.
- Rename its private package to `zusound-demo`.
- Update root workspace entries, scripts, Turbo inputs, CI paths, docs, and Changesets ignore configuration.
- Configure Vite with a GitHub Pages-safe base path.
- Deploy `demo/dist` directly. Remove staging, vendoring, verification, and custom HTTP/SSE server scripts.

### Required retained behavior

The consolidated demo must retain:

- User-gesture audio activation.
- Representative state-change triggers.
- Live aesthetic controls.
- Rapid-update or burst demonstration.
- Middleware and subscriber usage guidance.
- Current API/options reference.
- Responsive layout and accessible controls.

The legacy local SSE mode is intentionally removed. It generates synthetic state events but is not part of ZuSound's API or consumer integration contract. Vite supplies the local development server.

### Demo dead-code cleanup

- Remove the unused `useMiddlewareStore` implementation.
- Keep only values and exports consumed by the application.
- Make the default option values module-private.
- Preserve middleware guidance as executable or displayed documentation without maintaining an unused store instance.

## Production-Code Cleanup

- Remove the duplicate default export from `packages/zusound/src/middleware.ts`.
- Define and export the singleton `zusound` from `packages/zusound/src/index.ts` by calling `createZusound()`, update internal tests to use the public entry, and delete `packages/zusound/src/middleware.ts`.
- Do not remove exported public types or runtime symbols based solely on internal usage scans; consumers are outside the repository.
- Use Knip with explicit workspace, script, package-entry, and demo-entry configuration so intentional public exports and maintenance scripts are not false positives.
- The final configured Knip run must have no unexplained unused files, dependencies, or exports.

## Maintenance-Tool Cleanup

Delete the custom local-artifact cleanup subsystem:

- `scripts/clean-local-artifact-targets.mjs`
- `scripts/clean-local-artifacts.mjs`
- `scripts/clean-local-artifacts.test.mjs`
- Root `clean:artifacts` and `test:clean-artifacts` scripts
- The corresponding mandatory CI step and documentation

Workspace `clean` tasks remain responsible for reproducible build and coverage outputs. Ignored editor, agent, dependency, and cache files remain governed by `.gitignore`; the repository does not need production-tested code whose purpose is deleting contributor-local state.

Delete `packages/zusound/.npmignore` because the package already uses a `files` allowlist. Validate the tarball contents directly after deletion.

## Documentation Consolidation

### Retained canonical documents

- `README.md`: project overview, installation, concise quick start, API highlights, demo link, and contributor links.
- `packages/zusound/README.md`: npm-facing API documentation, kept synchronized with managed root README sections.
- `CONTRIBUTING.md`: merged development setup, commands, testing, intentional dependency constraints, skill contribution notes, and pull-request expectations.
- `docs/RELEASING.md`: merged release prerequisites, release procedure, rollback, and troubleshooting.
- `demo/README.md`: only demo-specific development and deployment information.
- `.agents/README.md`: concise canonical skill structure, validation, bridge generation, and artifact policy.
- `SECURITY.md`, `CODE_OF_CONDUCT.md`, `LICENSE`, and `packages/zusound/CHANGELOG.md`.

### Removed or merged documents

Delete after preserving any still-current information in the retained documents:

- `QUICK_START.md`
- `REQUIREMENTS.MD`
- `DEVELOPMENT.md`
- `docs/CONTRIB.md`
- `docs/QA_CHECKLIST.md`
- `docs/RUNBOOK.md`
- `docs/RELEASE_GATES.md`
- `docs/AGENT_SKILLS_ADOPTION.md`
- `docs/SKILL_ROLLOUT.md`
- `docs/SKILL_ARTIFACT_POLICY.md`
- `docs/SKILL_MIGRATION_REHEARSAL.md`
- Legacy `demo/API_DOCS_STRATEGY.md`
- Empty `docs/assets/.gitkeep`
- `.env.example`, because there are no repository runtime environment variables and release authentication is documented separately

Remove the broken GIF block from the root README without adding a replacement binary asset.

### Documentation gate

Add one deterministic `docs:check` command that:

- Runs README synchronization checking.
- Verifies tracked local Markdown and HTML file references exist.
- Avoids live external-link requests so CI is not network-flaky.

## CI and Dependency Automation

### CI quality jobs

- Full quality matrix: Node 22.22 minimum and Node 24 LTS.
- Required checks: install, docs check, skill validation, Knip, lint, typecheck, test coverage, library build, and demo build.
- Remove the Node 18 job and custom cleanup regression.
- Keep the Zustand compatibility matrix, updating latest 4.x and 5.x versions while retaining oldest supported 4.0.0.

### Package validation

Validate the built tarball, not only the source workspace:

- `npm pack` or `pnpm pack` from `packages/zusound`.
- Expected-file assertion for package metadata, license, README, declarations, ESM, CJS, and intended source maps.
- Publint validation.
- `@arethetypeswrong/cli` package-exports and declaration validation.
- Temporary consumer fixtures using the tarball with supported Zustand 4 and 5 versions.

### Demo deployment

- Build the consolidated Vite demo after the library build.
- Upload `demo/dist` to GitHub Pages.
- Ensure generated asset URLs work under the repository Pages path.
- Remove all references to legacy staged output and SSE modes.

### Automated updates

Add `.github/dependabot.yml` with grouped weekly updates for:

- npm/pnpm dependencies across the workspace.
- GitHub Actions.

Group coherent tool families where possible so Vite/plugin, Vitest/coverage, ESLint, and TypeScript ESLint changes arrive together.

## Failure Handling and Rollback

- Commit each dependency family separately after its narrow gate passes.
- Keep demo consolidation, production dead-code cleanup, documentation consolidation, and CI automation in separate reversible commits.
- Do not delete the legacy demo until the React demo builds with the package tarball or workspace package, works under a Pages-safe base path, and retains the required behavior listed above.
- If a latest stable dependency fails due to a documented engine or peer conflict, use the highest compatible stable version and record the exact constraint in `CONTRIBUTING.md`.
- Do not use `--force`, broad pnpm overrides, ignored peer errors, vulnerability dismissals, or test suppression as completion mechanisms.
- If a public export appears unused, preserve it unless the package's documented API explicitly excludes it or a separate breaking-change decision is approved.

## Verification and Acceptance Criteria

The modernization is complete only when all of the following are observed from the final tree:

1. A frozen pnpm 11 install succeeds on Node 22.22 minimum and Node 24 LTS.
2. `pnpm audit --json` reports zero info, low, moderate, high, and critical vulnerabilities.
3. `pnpm docs:check` passes with no README drift or broken tracked local references.
4. Skills validation passes for all four retained skills.
5. Configured Knip reports no unexplained unused files, dependencies, or exports.
6. Formatting checks pass.
7. ESLint 10 passes for the library, demo, configuration, and maintained scripts included in its scope.
8. TypeScript checks pass for the library and strict demo.
9. All existing 102 library tests pass; behavioral changes require additional tests rather than reducing the count.
10. Existing coverage thresholds remain satisfied or improve.
11. Library and consolidated demo production builds pass.
12. The packed package contains only intended distributable files and passes Publint and package-exports/type validation.
13. Tarball consumer checks pass with oldest supported Zustand 4, latest Zustand 4, and latest Zustand 5.
14. The GitHub Pages demo loads with no missing assets or console errors and its required interaction paths work.
15. `pnpm outdated --recursive` reports only explicitly documented compatibility constraints, chiefly TypeScript and Node typings when newer incompatible families exist.
16. The final Git diff contains no generated build outputs, temporary package tarballs, or unrelated changes.
17. The public API, package version, runtime behavior, and Zustand peer range remain unchanged.

## Implementation Order

1. Establish the clean baseline and add regression checks for accepted cleanup boundaries.
2. Remove unused dependencies and superseded maintenance tooling.
3. Upgrade Node, pnpm, and dependency families with narrow verification after each family.
4. Consolidate and validate the demo before deleting legacy files.
5. Remove internal dead code without changing public exports.
6. Consolidate documentation and add the local-reference gate.
7. Update CI, package validation, deployment, and Dependabot automation.
8. Run the complete clean-install and end-user verification matrix.
