# Repository Modernization and Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move ZuSound to a zero-audit, current stable development stack while consolidating the repository around one published package, one typed deployed demo, concise current documentation, and evidence-backed maintenance gates.

**Architecture:** Keep `packages/zusound` as the only published runtime package and turn the current React/Vite example into the sole private `demo` workspace and GitHub Pages application. Centralize pnpm 11 resolution and build policy in `pnpm-workspace.yaml`, preserve the library's public API and Zustand peer range, and enforce dependency, documentation, dead-code, package, and demo quality through local scripts and CI.

**Tech Stack:** Node 22.22.2 minimum, Node 24.19.0 LTS, pnpm 11.20.0, TypeScript 5.9.3, ESLint 10.8.1, Vite 8.2.1, Vitest 4.1.10, jsdom 30.0.1, React 19.2.8, Turbo 2.10.9, Knip 6.32.0, Publint 0.3.23, `@arethetypeswrong/cli` 0.18.5, Action Validator 0.6.0, Dependabot Validator 0.3.3, GitHub Actions

## Global Constraints

- Execute in an isolated worktree created through `superpowers:using-git-worktrees`; do not implement directly in the user's active checkout.
- Keep package version `0.2.4` unchanged.
- Keep public runtime exports `zusound`, `createZusound`, and `version`, plus every currently exported public type.
- Keep the ESM and CJS runtime entry paths while correcting their conditional declaration paths to `dist/index.d.ts` and `dist/index.d.cts` respectively.
- Keep zero runtime dependencies and peer dependency `zustand >=4.0.0 <6.0.0`.
- Keep build target `ES2020` and all audio, diffing, scheduling, middleware, default-option, and error behavior unchanged.
- Set root `engines.node` to `>=22.22.2`, `.nvmrc` to `24.19.0`, `.tool-versions` to Node `24.19.0` plus `22.22.2`, and `packageManager` to `pnpm@11.20.0`.
- Keep TypeScript on `5.9.3` because stable TypeScript ESLint supports TypeScript `<6.1`; do not use TypeScript 7 or prerelease tooling.
- Use `@types/node` `24.13.3` across the workspace instead of Node 26 typings.
- Keep exact `esbuild: 0.28.1` and `nanoid: 3.3.18` under `pnpm-workspace.yaml#overrides`; without them the verified pnpm 11 graph resolves vulnerable `esbuild@0.27.7` and can resolve vulnerable `nanoid@3.3.16`.
- Configure `allowBuilds.esbuild: true` in `pnpm-workspace.yaml`; do not allow any other dependency build script.
- Do not add `minimumReleaseAgeExclude` entries to bypass pnpm 11's one-day release-age policy.
- Keep all four canonical `.agents/skills` directories and their user-facing content.
- Do not publish, tag, push, or change npm/GitHub release state as part of implementation.
- Commit each task independently after its listed verification passes.

---

### Task 1: Upgrade Node, pnpm, and the dependency graph

**Files:**

- Modify: `package.json`
- Modify: `packages/zusound/package.json`
- Modify: `examples/package.json`
- Modify: `pnpm-workspace.yaml`
- Modify: `.nvmrc`
- Create: `.tool-versions`
- Modify: `.husky/pre-commit`
- Modify: `.husky/pre-push`
- Create: `scripts/check-audit.mjs`
- Regenerate: `pnpm-lock.yaml`

**Interfaces:**

- Consumes: the exact compatibility rules in `docs/superpowers/specs/2026-08-08-repository-modernization-and-consolidation-design.md`.
- Produces: a pnpm 11 lockfile with zero advisories, Node 22.22/24.19 support, TypeScript 5.9, ESLint 10, Vite 8, Vitest 4, and the existing dual-demo paths still intact until Task 3.

- [ ] **Step 1: Capture the dependency RED gates**

Run from the isolated worktree before editing:

```bash
pnpm audit --json
pnpm outdated --recursive --format json
pnpm --version
node -p "require('./package.json').packageManager"
```

Expected:

- Audit exits nonzero and reports the current high-severity `nanoid@3.3.16` advisory.
- Outdated reports major gaps including ESLint 10, Vite 8, Vitest 4, jsdom 30, Husky 9, lint-staged 17, and TypeScript 7.
- The active and declared package-manager versions are `10.34.5`, proving the separate pnpm 11 migration gap.

- [ ] **Step 2: Declare and install the exact verification runtimes**

Create `.tool-versions` before invoking a version manager:

```text
node 24.19.0 22.22.2
```

The file is understood by mise and asdf. This plan uses mise for the non-interactive matrix commands. Confirm it is installed, then install the declared runtimes:

```bash
command -v mise
mise install
mise exec node@22.22.2 -- node --version
mise exec node@24.19.0 -- node --version
```

Expected: `command -v mise` resolves and the version commands print `v22.22.2` and `v24.19.0`. If mise is unavailable, stop and follow the [official mise setup guide](https://mise.jdx.dev/getting-started.html) before continuing. Do not silently run the matrix under a different Node release.

- [ ] **Step 3: Update the root manifest**

Keep repository metadata, `private: true`, Changesets scripts, README scripts, skill scripts, release scripts, Turbo scripts, and lint-staged rules unless explicitly changed below.

Set these root scripts now:

```json
{
  "scripts": {
    "prepare": "husky",
    "security:check": "node scripts/check-audit.mjs"
  }
}
```

Replace root `devDependencies` with this exact version policy while temporarily retaining root Zustand for the legacy demo until Task 3:

```json
{
  "devDependencies": {
    "@action-validator/cli": "^0.6.0",
    "@action-validator/core": "^0.6.0",
    "@arethetypeswrong/cli": "^0.18.5",
    "@bugron/validate-dependabot-yaml": "^0.3.3",
    "@changesets/changelog-github": "^0.7.0",
    "@changesets/cli": "^2.31.1",
    "@eslint/js": "^10.0.1",
    "@typescript-eslint/eslint-plugin": "^8.66.0",
    "@typescript-eslint/parser": "^8.66.0",
    "eslint": "^10.8.1",
    "eslint-config-prettier": "^10.1.8",
    "eslint-plugin-react-hooks": "^7.1.1",
    "eslint-plugin-react-refresh": "^0.5.3",
    "globals": "^17.9.0",
    "husky": "^9.1.7",
    "knip": "^6.32.0",
    "lint-staged": "^17.3.0",
    "prettier": "^3.9.6",
    "publint": "^0.3.23",
    "turbo": "^2.10.9",
    "typescript": "^5.9.3",
    "zustand": "^5.0.14"
  },
  "packageManager": "pnpm@11.20.0",
  "engines": {
    "node": ">=22.22.2"
  }
}
```

Remove the root `pnpm` object entirely. Remove `eslint-plugin-react`; it is unused and its latest stable peer range does not support ESLint 10. Remove root `@types/node`; the root has no TypeScript project, while the package and demo declare Node 24 typings directly for their own Node-side configuration files.

Create `scripts/check-audit.mjs` so zero audit is an asserted metadata contract rather than reliance on pnpm's default severity threshold:

```js
#!/usr/bin/env node

import { spawnSync } from 'node:child_process'

const severities = ['info', 'low', 'moderate', 'high', 'critical']
const pnpmCli = process.env.npm_execpath
if (!pnpmCli) {
  console.error('[security-check] Run this checker through pnpm security:check')
  process.exit(1)
}

const result = spawnSync(process.execPath, [pnpmCli, '--reporter=silent', 'audit', '--json'], {
  cwd: process.cwd(),
  encoding: 'utf8',
})

if (result.error) {
  console.error(`[security-check] Unable to run pnpm audit: ${result.error.message}`)
  process.exit(1)
}

let report
try {
  report = JSON.parse(result.stdout)
} catch {
  console.error('[security-check] pnpm audit did not return valid JSON')
  if (result.stdout.trim()) console.error(result.stdout.trim())
  if (result.stderr.trim()) console.error(result.stderr.trim())
  process.exit(1)
}

const vulnerabilities = report.metadata?.vulnerabilities
const invalid = severities.filter(
  (severity) => !Number.isInteger(vulnerabilities?.[severity]) || vulnerabilities[severity] !== 0
)
const advisoryCount = Object.keys(report.advisories ?? {}).length

if (result.status !== 0 || invalid.length > 0 || advisoryCount > 0) {
  console.error('[security-check] Vulnerabilities detected or audit metadata is incomplete')
  console.error(JSON.stringify({ status: result.status, vulnerabilities, advisoryCount }, null, 2))
  process.exit(1)
}

console.log(`[security-check] OK (${severities.map((severity) => `${severity}=0`).join(', ')})`)
```

This exact checker was validated RED against the current `nanoid@3.3.16` advisory and GREEN against the final zero-advisory graph.

- [ ] **Step 4: Update the public package development graph**

Preserve the package name, version, current runtime entry paths, `files`, scripts, peer dependency, and absence of a `dependencies` field. Replace only `devDependencies` in this task; Task 6 corrects the conditional declaration map after capturing the package-validation failure.

```json
{
  "devDependencies": {
    "@types/node": "^24.13.3",
    "@vitest/coverage-v8": "^4.1.10",
    "jsdom": "^30.0.1",
    "tsup": "^8.5.1",
    "typescript": "^5.9.3",
    "vite": "^8.2.1",
    "vitest": "^4.1.10",
    "zustand": "^5.0.14"
  }
}
```

This removes the unused direct `html-encoding-sniffer` dependency. Keep direct Vite because Vitest 4 declares Vite as a non-optional peer.

- [ ] **Step 5: Update the React example dependency graph in place**

Keep its current package name and path until Task 3. Set:

```json
{
  "dependencies": {
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "zustand": "^5.0.14",
    "zusound": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^24.13.3",
    "@types/react": "^19.2.18",
    "@types/react-dom": "^19.2.4",
    "@vitejs/plugin-react": "^6.0.5",
    "typescript": "^5.9.3",
    "vite": "^8.2.1"
  }
}
```

- [ ] **Step 6: Move pnpm 11 settings into the workspace file**

Replace `pnpm-workspace.yaml` with:

```yaml
packages:
  - packages/zusound
  - examples

overrides:
  esbuild: 0.28.1
  nanoid: 3.3.18

allowBuilds:
  esbuild: true
```

Do not add `minimumReleaseAgeExclude`.

- [ ] **Step 7: Pin the default local runtime and migrate Husky hooks**

Set `.nvmrc` to:

```text
24.19.0
```

`.tool-versions` owns the exact two-version verification matrix. `.nvmrc` keeps Node 24 as the normal single-runtime development default.

Replace `.husky/pre-commit` with:

```sh
pnpm exec lint-staged
```

Replace `.husky/pre-push` with:

```sh
pnpm test
```

Then make both hooks executable:

```bash
chmod +x .husky/pre-commit .husky/pre-push
```

This removes Husky 8's deprecated `_/husky.sh` bootstrap and fixes the currently tracked `100644` hook modes.

- [ ] **Step 8: Regenerate the lockfile instead of incrementally preserving stale transitive versions**

The isolated trial proved that the natural pnpm 11 graph can preserve or freshly resolve vulnerable `nanoid@3.3.16`. The exact `nanoid: 3.3.18` override is therefore required alongside the `esbuild: 0.28.1` override.

```bash
rm pnpm-lock.yaml
COREPACK_ENABLE_DOWNLOAD_PROMPT=0 mise exec node@24.19.0 -- corepack pnpm --version
COREPACK_ENABLE_DOWNLOAD_PROMPT=0 mise exec node@24.19.0 -- corepack pnpm install --lockfile-only --ignore-scripts
COREPACK_ENABLE_DOWNLOAD_PROMPT=0 mise exec node@24.19.0 -- corepack pnpm install --frozen-lockfile
```

Expected:

- pnpm reports version `11.20.0`.
- esbuild is the only allowed dependency build and resolves to `0.28.1`.
- nanoid resolves to `3.3.18`.
- No `minimumReleaseAgeExclude` block is added.

- [ ] **Step 9: Verify the dependency GREEN gates**

```bash
COREPACK_ENABLE_DOWNLOAD_PROMPT=0 mise exec node@24.19.0 -- corepack pnpm security:check
COREPACK_ENABLE_DOWNLOAD_PROMPT=0 mise exec node@24.19.0 -- corepack pnpm why esbuild
COREPACK_ENABLE_DOWNLOAD_PROMPT=0 mise exec node@24.19.0 -- corepack pnpm why nanoid
```

Expected audit metadata:

```json
{
  "info": 0,
  "low": 0,
  "moderate": 0,
  "high": 0,
  "critical": 0
}
```

Expected: the checker explicitly reports `info=0`, `low=0`, `moderate=0`, `high=0`, and `critical=0`; esbuild is `0.28.1`; nanoid is `3.3.18`.

- [ ] **Step 10: Run compatibility-focused gates on Node 24**

```bash
COREPACK_ENABLE_DOWNLOAD_PROMPT=0 mise exec node@24.19.0 -- corepack pnpm lint
COREPACK_ENABLE_DOWNLOAD_PROMPT=0 mise exec node@24.19.0 -- corepack pnpm typecheck
COREPACK_ENABLE_DOWNLOAD_PROMPT=0 mise exec node@24.19.0 -- corepack pnpm test
COREPACK_ENABLE_DOWNLOAD_PROMPT=0 mise exec node@24.19.0 -- corepack pnpm build
```

Expected: ESLint 10 reports no errors, all 102 library tests pass, and both existing workspace builds succeed.

- [ ] **Step 11: Prove the minimum Node runtime accepts the frozen graph**

```bash
COREPACK_ENABLE_DOWNLOAD_PROMPT=0 mise exec node@22.22.2 -- corepack pnpm install --frozen-lockfile
COREPACK_ENABLE_DOWNLOAD_PROMPT=0 mise exec node@22.22.2 -- corepack pnpm -C packages/zusound test
COREPACK_ENABLE_DOWNLOAD_PROMPT=0 mise exec node@22.22.2 -- corepack pnpm -C packages/zusound build
COREPACK_ENABLE_DOWNLOAD_PROMPT=0 mise exec node@22.22.2 -- corepack pnpm -C examples build
```

Expected: frozen install, 102 tests, the library build, and the React build pass on Node 22.22.2.

- [ ] **Step 12: Commit the dependency graph**

```bash
git add package.json packages/zusound/package.json examples/package.json pnpm-workspace.yaml pnpm-lock.yaml .nvmrc .tool-versions .husky/pre-commit .husky/pre-push scripts/check-audit.mjs
git commit -m "chore: modernize repository dependencies"
```

---

### Task 2: Remove obsolete maintenance tooling and modernize lint coverage

**Files:**

- Modify: `package.json`
- Modify: `packages/zusound/package.json`
- Modify: `examples/package.json`
- Modify: `eslint.config.js`
- Modify: `.github/workflows/ci.yml`
- Modify: `packages/zusound/__tests__/audio.test.ts`
- Modify: `packages/zusound/__tests__/middleware.test.ts`
- Modify: `packages/zusound/__tests__/performanceMode.test.ts`
- Modify: `packages/zusound/__tests__/synthesis.test.ts`
- Create: `packages/zusound/tsconfig.test.json`
- Create: `examples/src/demoOptions.ts`
- Modify: `examples/src/components/AestheticPanel.tsx`
- Modify: `examples/src/sections/Demo.tsx`
- Delete: `packages/zusound/.npmignore`
- Delete: `scripts/clean-local-artifact-targets.mjs`
- Delete: `scripts/clean-local-artifacts.mjs`
- Delete: `scripts/clean-local-artifacts.test.mjs`

**Interfaces:**

- Consumes: the pnpm 11 dependency graph from Task 1.
- Produces: ESLint 10 coverage for root scripts/config, library source/tests/config, and the React app; no custom code or CI gate for deleting contributor-local artifacts.

- [ ] **Step 1: Capture the current lint and cleanup behavior**

```bash
pnpm lint
pnpm test:clean-artifacts
```

Expected: both pass before removal, demonstrating that the cleanup subsystem is deliberate but not evidence of continuing product value.

- [ ] **Step 2: Replace the ESLint flat configuration**

Replace `eslint.config.js` with:

```js
import js from '@eslint/js'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'

const sharedRules = {
  'prefer-const': 'error',
  'object-shorthand': ['error', 'always'],
  'prefer-template': 'error',
  'no-var': 'error',
  eqeqeq: ['error', 'always'],
}

export default [
  {
    ignores: [
      '**/coverage/**',
      '**/dist/**',
      '**/node_modules/**',
      '**/.turbo/**',
      'docs/superpowers/**',
    ],
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...sharedRules,
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsParser,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...sharedRules,
      'no-redeclare': 'off',
      'no-undef': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-redeclare': 'error',
    },
  },
  {
    files: ['{examples,demo}/src/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],
    },
  },
  prettier,
]
```

- [ ] **Step 3: Expand workspace lint and package typecheck scripts**

Set root lint to include root-maintained JavaScript before Turbo:

```json
{
  "scripts": {
    "lint": "eslint eslint.config.js scripts --max-warnings=0 && turbo run lint"
  }
}
```

Set package lint to:

```json
{
  "scripts": {
    "lint": "eslint src __tests__ tsup.config.ts vitest.config.ts --max-warnings=0",
    "typecheck": "tsc --noEmit && tsc --noEmit -p tsconfig.test.json"
  }
}
```

Create `packages/zusound/tsconfig.test.json` so tests and tool configuration are part of strict typechecking without changing the production declaration build:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts", "__tests__/**/*.ts", "tsup.config.ts", "vitest.config.ts"]
}
```

Add to `examples/package.json`:

```json
{
  "scripts": {
    "lint": "eslint src vite.config.ts --max-warnings=0"
  }
}
```

- [ ] **Step 4: Remove the known lint and test-type findings**

```bash
pnpm lint
pnpm -C packages/zusound exec tsc --noEmit -p tsconfig.test.json
```

Expected RED: lint reports ten explicit-`any` errors in the four test files and one React Refresh module-boundary error in `AestheticPanel.tsx`. Test/config typechecking reports two default-import errors for the obsolete Zustand 4 compatibility shims in `middleware.test.ts` and `performanceMode.test.ts`.

Apply these exact behavior-preserving fixes:

1. Delete the `(globalThis as any).window ??= globalThis` assignments from `audio.test.ts`, `middleware.test.ts`, and `performanceMode.test.ts`; Vitest's configured jsdom environment already supplies `window`.
2. In `middleware.test.ts`, define one shared cleanup-store type and conversion helper immediately after `CounterState`:

   ```ts
   type CounterStoreWithCleanup = StoreApi<CounterState> & {
     zusoundCleanup: () => void
   }

   const withCleanup = (store: StoreApi<CounterState>): CounterStoreWithCleanup =>
     store as unknown as CounterStoreWithCleanup
   ```

   Replace the four `(store as any).zusoundCleanup` accesses with `withCleanup(store).zusoundCleanup`, and remove the three duplicate local `CounterStoreWithCleanup` declarations while retaining their existing typed casts.
3. Replace the default/named fallback imports and compatibility comments in `middleware.test.ts` and `performanceMode.test.ts` with direct named imports from the final Zustand 5 development dependency:

   ```ts
   import { createStore, type StoreApi } from 'zustand/vanilla'
   ```

   `performanceMode.test.ts` imports only `createStore`. Runtime compatibility with Zustand `4.0.0`, `4.5.7`, and `5.0.14` remains covered by the packed consumer matrix instead of source tests compiled against mutually incompatible declaration shapes.
4. In `synthesis.test.ts`, type the mock option as `PeriodicWaveConstraints`. Cast the two inspected mock waves as `unknown as { imag: Float32Array }` instead of `any`. The TypeScript lint block disables core `no-undef` because TypeScript performs identifier resolution and the core rule incorrectly flags DOM type-only globals.
5. Move the reusable demo option value out of the component module. Create `examples/src/demoOptions.ts`:

   ```ts
   export type DemoOptions = {
     volume: number
     debounceMs: number
     aesthetics: {
       pleasantness: number
       brightness: number
       arousal: number
       valence: number
       simultaneity: number
       baseMidi: number
     }
   }

   export const defaultDemoOptions: DemoOptions = {
     volume: 0.3,
     debounceMs: 50,
     aesthetics: {
       pleasantness: 0.7,
       brightness: 0.6,
       arousal: 0.6,
       valence: 0.6,
       simultaneity: 1,
       baseMidi: 69,
     },
   }
   ```

   Delete the exported `DemoOptions` and `defaultDemoOptions` declarations from `examples/src/components/AestheticPanel.tsx`, then import them there with:

   ```ts
   import { defaultDemoOptions, type DemoOptions } from '../demoOptions'
   ```

   In `examples/src/sections/Demo.tsx`, import only `AestheticPanel` from the component module and import `defaultDemoOptions` plus `DemoOptions` from `../demoOptions`.

Format every file changed by this finding-remediation step, including the two tests whose untouched surrounding code currently fails repository Prettier:

```bash
pnpm exec prettier --write eslint.config.js packages/zusound/tsconfig.test.json packages/zusound/__tests__/audio.test.ts packages/zusound/__tests__/middleware.test.ts packages/zusound/__tests__/performanceMode.test.ts packages/zusound/__tests__/synthesis.test.ts examples/src/demoOptions.ts examples/src/components/AestheticPanel.tsx examples/src/sections/Demo.tsx
pnpm exec prettier --check eslint.config.js packages/zusound/tsconfig.test.json packages/zusound/__tests__/audio.test.ts packages/zusound/__tests__/middleware.test.ts packages/zusound/__tests__/performanceMode.test.ts packages/zusound/__tests__/synthesis.test.ts examples/src/demoOptions.ts examples/src/components/AestheticPanel.tsx examples/src/sections/Demo.tsx
```

Run again:

```bash
pnpm lint
pnpm -C packages/zusound typecheck
pnpm -C packages/zusound test
pnpm -C examples typecheck
pnpm -C examples build
```

Expected GREEN: zero lint errors, zero lint warnings, package and demo typechecks pass, all 102 tests pass, and the demo builds. These exact changes were validated against the upgraded ESLint 10/Vitest 4/Vite 8 prototype. Do not suppress findings with broad ignores.

- [ ] **Step 5: Remove the local-artifact deletion subsystem**

Delete the three cleanup scripts and delete the `clean:artifacts` and `test:clean-artifacts` keys from root `package.json#scripts`.

Remove the `Cleanup regression` step from `.github/workflows/ci.yml`.

Delete `packages/zusound/.npmignore`; publication remains controlled by `package.json#files` and Task 6's tarball assertion.

- [ ] **Step 6: Verify the reduced maintenance surface**

```bash
node -e "const p=require('./package.json'); if ('clean:artifacts' in p.scripts || 'test:clean-artifacts' in p.scripts) process.exit(1)"
pnpm lint
pnpm typecheck
pnpm test
```

Expected: no cleanup scripts remain, lint/typecheck pass, and all 102 tests pass.

- [ ] **Step 7: Commit maintenance cleanup**

```bash
git add package.json packages/zusound/package.json examples/package.json eslint.config.js .github/workflows/ci.yml packages/zusound/tsconfig.test.json packages/zusound/__tests__/audio.test.ts packages/zusound/__tests__/middleware.test.ts packages/zusound/__tests__/performanceMode.test.ts packages/zusound/__tests__/synthesis.test.ts examples/src/demoOptions.ts examples/src/components/AestheticPanel.tsx examples/src/sections/Demo.tsx
git add -u packages/zusound/.npmignore scripts/clean-local-artifact-targets.mjs scripts/clean-local-artifacts.mjs scripts/clean-local-artifacts.test.mjs
git commit -m "refactor: remove obsolete maintenance tooling"
```

---

### Task 3: Consolidate the React app into the single demo workspace

**Files:**

- Modify before move: `examples/vite.config.ts`
- Modify before move: `examples/src/store.ts`
- Delete: legacy `demo/**`
- Move: `examples/**` to `demo/**`
- Modify: `demo/package.json`
- Modify: `package.json`
- Modify: `pnpm-workspace.yaml`
- Modify: `pnpm-lock.yaml`
- Modify: `.changeset/config.json`
- Modify: `.gitignore`
- Modify: `.github/workflows/deploy-demo.yml`
- Modify: `.github/workflows/release-check.yml`

**Interfaces:**

- Consumes: Vite 8, React plugin 6, React 19, and the passing strict React app from Task 1.
- Produces: private workspace `zusound-demo` at `demo/`, GitHub Pages artifact `demo/dist`, and no root Zustand dependency or legacy staging/SSE code.

- [ ] **Step 1: Make the React build Pages-safe before deleting anything**

Replace `examples/vite.config.ts` with:

```ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  plugins: [react()],
})
```

Run:

```bash
pnpm -C packages/zusound build
pnpm -C examples typecheck
pnpm -C examples build
node -e "const fs=require('node:fs'); const html=fs.readFileSync('examples/dist/index.html','utf8'); if (!html.includes('./assets/')) throw new Error('Vite assets are not Pages-relative')"
```

Expected: strict typecheck/build pass and generated asset URLs begin with `./assets/`.

- [ ] **Step 2: Remove unused demo store code before the move**

Replace the import in `examples/src/store.ts` with:

```ts
import { createZusound, type ZusoundOptions } from 'zusound'
```

Delete the entire `defaultOptions` constant and `useMiddlewareStore` declaration. Change the subscriber binding to require explicit options:

```ts
export function bindSubscriberZusound(options: ZusoundOptions): () => void {
  const instance = createZusound(options)
  const unsubscribe = useSubscriberStore.subscribe(instance)
  return () => {
    unsubscribe()
    instance.cleanup()
  }
}
```

Run:

```bash
pnpm -C examples lint
pnpm -C examples typecheck
pnpm -C examples build
```

Expected: all pass; `Demo.tsx` remains the only caller and already supplies options.

- [ ] **Step 3: Prove the React app retains required demo behavior before deletion**

Check the browser tool status first and run its setup action once if needed. If the live browser bridge is still unavailable, stop this task before deletion; static HTML inspection is not an acceptable substitute for the approved interaction, focus, audio-gesture, and responsive checks.

Start the built React app on a dedicated port:

```bash
nohup pnpm -C examples preview --host 127.0.0.1 --port 4174 > "$JCODE_SCRATCH_DIR/zusound-examples-preview.log" 2>&1 &
echo $! > "$JCODE_SCRATCH_DIR/zusound-examples-preview.pid"
```

Use browser automation against `http://127.0.0.1:4174` and verify all approved replacement criteria before touching the legacy demo:

1. The page loads with no console errors or missing assets.
2. The user-gesture audio activation control is visible and responds.
3. Representative increment, toggle, add, remove, and burst controls update live state and log output.
4. Aesthetic controls are live after activation.
5. Middleware and subscriber guidance is visible.
6. The current public options reference renders.
7. Controls have visible keyboard focus and usable labels.
8. The layout remains readable at desktop and 375px viewport widths.

Always stop the preview after recording evidence, including when a browser assertion fails:

```bash
kill "$(cat "$JCODE_SCRATCH_DIR/zusound-examples-preview.pid")"
rm -f "$JCODE_SCRATCH_DIR/zusound-examples-preview.pid" "$JCODE_SCRATCH_DIR/zusound-examples-preview.log"
```

Expected: all eight checks pass. A failure blocks deletion and must be corrected in the React app before continuing.

- [ ] **Step 4: Remove the legacy demo and move the React workspace**

```bash
git rm -r demo
git mv examples demo
```

The deleted legacy surface includes `server.js`, `stage.js`, `check-stage.js`, `clean-stage.js`, vanilla app assets, SSE behavior, and `API_DOCS_STRATEGY.md`.

- [ ] **Step 5: Rename and simplify the private demo package**

Set `demo/package.json#name` to `zusound-demo`. Keep `private: true`, version `0.4.0`, Vite scripts, dependencies, and strict TypeScript scripts.

- [ ] **Step 6: Update workspace ownership and root demo scripts**

Set root workspaces to:

```json
{
  "workspaces": ["packages/zusound", "demo"]
}
```

Replace all old demo aliases with:

```json
{
  "scripts": {
    "demo:build": "pnpm -C packages/zusound build && pnpm -C demo build",
    "demo:dev": "pnpm -C packages/zusound build && pnpm -C demo dev",
    "demo:preview": "pnpm demo:build && pnpm -C demo preview",
    "demo:typecheck": "pnpm -C packages/zusound build && pnpm -C demo typecheck"
  }
}
```

Remove:

- `demo:stage`
- `demo:stage:clean`
- `demo:verify`
- `demo:react:build`
- `demo:react:dev`
- `demo:react:typecheck`

Remove root `zustand` from `devDependencies`; the demo now declares Zustand directly.

Replace `pnpm-workspace.yaml#packages` with:

```yaml
packages:
  - packages/zusound
  - demo
```

Preserve the existing `overrides` and `allowBuilds` blocks.

Set `.changeset/config.json#ignore` to:

```json
["zusound-demo"]
```

Remove the explicit `demo/dist-site` ignore line; the general `dist` rule covers `demo/dist`.

- [ ] **Step 7: Update release-check assumptions**

Delete the `Report demo package changesets` step from `.github/workflows/release-check.yml`; Changesets already ignores `zusound-demo` through its canonical config.

- [ ] **Step 8: Replace the Pages build workflow's legacy staging path**

Keep its branch trigger, manual trigger, permissions, environment, and concurrency. Replace the push path filter with the final repository paths so deleted `examples/**` no longer triggers deployment:

```yaml
paths:
  - '.github/workflows/deploy-demo.yml'
  - 'demo/**'
  - 'packages/zusound/**'
  - 'package.json'
  - 'pnpm-lock.yaml'
  - 'pnpm-workspace.yaml'
```

Replace build commands with:

```yaml
- name: Install dependencies
  run: pnpm install --frozen-lockfile

- name: Build library
  run: pnpm -C packages/zusound build

- name: Validate and build demo
  run: |
    pnpm -C demo typecheck
    pnpm -C demo build

- name: Upload artifact
  uses: actions/upload-pages-artifact@56afc609e74202658d3ffba0e8f6dda462b719fa # v3
  with:
    path: ./demo/dist
```

Replace the old all-workspace `Build packages` step with the focused library build above. Remove `Stage demo` and every `demo/dist-site` reference. Task 7 upgrades the action revisions.

- [ ] **Step 9: Regenerate the renamed workspace lockfile**

```bash
COREPACK_ENABLE_DOWNLOAD_PROMPT=0 mise exec node@24.19.0 -- corepack pnpm install --lockfile-only --ignore-scripts
COREPACK_ENABLE_DOWNLOAD_PROMPT=0 mise exec node@24.19.0 -- corepack pnpm install --frozen-lockfile
```

Expected lockfile importers: `.`, `demo`, and `packages/zusound`; no `examples` importer and no root Zustand entry.

- [ ] **Step 10: Verify the consolidated demo**

```bash
pnpm lint
pnpm typecheck
pnpm build
node -e "const fs=require('node:fs'); const html=fs.readFileSync('demo/dist/index.html','utf8'); if (!html.includes('./assets/')) throw new Error('Vite assets are not Pages-relative')"
pnpm security:check
```

Expected: one demo workspace builds, root build passes, relative assets are present, and audit remains zero.

- [ ] **Step 11: Commit demo consolidation**

```bash
git add package.json pnpm-workspace.yaml pnpm-lock.yaml .changeset/config.json .gitignore .github/workflows/deploy-demo.yml .github/workflows/release-check.yml
git add -A -- demo examples
git commit -m "refactor: consolidate the project demo"
```

---

### Task 4: Remove the redundant middleware wrapper without changing the public API

**Files:**

- Modify: `packages/zusound/src/index.ts`
- Delete: `packages/zusound/src/middleware.ts`
- Modify: `packages/zusound/__tests__/middleware.test.ts`
- Modify: `packages/zusound/__tests__/performanceMode.test.ts`
- Modify: `packages/zusound/__tests__/version.test.ts`

**Interfaces:**

- Consumes: `createZusound(options?: ZusoundOptions): ZusoundInstance` from `packages/zusound/src/adapter.ts`.
- Produces: unchanged public named exports from `packages/zusound/src/index.ts` with no duplicate default export or wrapper module.

- [ ] **Step 1: Point regression tests at the public entry**

Change middleware-test imports to:

```ts
import { createZusound, zusound } from '../src/index'
import { attachZusound } from '../src/adapter'
```

Change `performanceMode.test.ts` to import `zusound` from `../src/index`.

Change `version.test.ts` to import `version` from `../src/index`.

Run:

```bash
pnpm -C packages/zusound test
```

Expected: all 102 tests still pass before deleting the wrapper.

- [ ] **Step 2: Define the singleton at the package entry**

In `packages/zusound/src/index.ts`, replace the middleware/adapter export lines with:

```ts
import { createZusound } from './adapter'

export { createZusound }
export const zusound = createZusound()
```

Keep every public type export and `version` export unchanged.

Delete `packages/zusound/src/middleware.ts`.

- [ ] **Step 3: Verify behavior, types, and bundle exports**

```bash
pnpm -C packages/zusound lint
pnpm -C packages/zusound typecheck
pnpm -C packages/zusound test
pnpm -C packages/zusound build
node --input-type=module -e "import('./packages/zusound/dist/index.js').then((m)=>{for (const k of ['zusound','createZusound','version']) if (!(k in m)) throw new Error('missing '+k)})"
```

Expected: all 102 tests pass and ESM bundle contains all three runtime exports.

- [ ] **Step 4: Commit internal dead-code removal**

```bash
git add packages/zusound/src/index.ts packages/zusound/__tests__/middleware.test.ts packages/zusound/__tests__/performanceMode.test.ts packages/zusound/__tests__/version.test.ts
git add -u packages/zusound/src/middleware.ts
git commit -m "refactor: simplify the public package entry"
```

---

### Task 5: Consolidate documentation and add deterministic local-link validation

**Files:**

- Create: `scripts/check-docs.mjs`
- Create: `CONTRIBUTING.md`
- Create: `docs/RELEASING.md`
- Create: `.agents/README.md`
- Replace: `demo/README.md`
- Modify: `package.json`
- Modify: `README.md`
- Modify: `packages/zusound/README.md`
- Modify: `.github/PULL_REQUEST_TEMPLATE.md`
- Delete: `.env.example`
- Delete: `QUICK_START.md`
- Delete: `REQUIREMENTS.MD`
- Delete: `DEVELOPMENT.md`
- Delete: `docs/CONTRIB.md`
- Delete: `docs/QA_CHECKLIST.md`
- Delete: `docs/RUNBOOK.md`
- Delete: `docs/RELEASE_GATES.md`
- Delete: `docs/AGENT_SKILLS_ADOPTION.md`
- Delete: `docs/SKILL_ROLLOUT.md`
- Delete: `docs/SKILL_ARTIFACT_POLICY.md`
- Delete: `docs/SKILL_MIGRATION_REHEARSAL.md`
- Delete: `docs/superpowers/plans/2026-08-01-dependency-and-project-cleanup.md`
- Delete: `docs/superpowers/specs/2026-08-01-dependency-and-project-cleanup-design.md`
- Delete: `docs/assets/.gitkeep`

**Interfaces:**

- Consumes: final `demo/` path and root script names from Task 3.
- Produces: `pnpm docs:check`, one contributor guide, one release guide, one skill-system guide, and no broken tracked local documentation references.

- [ ] **Step 1: Add the local-reference checker**

Create `scripts/check-docs.mjs`:

```js
#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, extname, relative, resolve, sep } from 'node:path'

const root = process.cwd()
const documents = execFileSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
  {
    cwd: root,
    encoding: 'utf8',
  }
)
  .split('\0')
  .filter(Boolean)
  .filter((file) => ['.md', '.mdx'].includes(extname(file).toLowerCase()))

const markdownLinks = /!?\[[^\]]*\]\(([^)]+)\)/g
const referenceLinks = /^\[[^\]]+\]:\s*(\S+)/gm
const htmlLinks = /(?:href|src)=["']([^"']+)["']/g
const failures = []

function stripCode(content) {
  const visible = []
  let fence = null

  for (const line of content.split('\n')) {
    const marker = line.match(/^\s*(`{3,}|~{3,})/)?.[1]
    if (marker) {
      if (!fence) {
        fence = marker
      } else if (marker[0] === fence[0] && marker.length >= fence.length) {
        fence = null
      }
      visible.push('')
      continue
    }

    visible.push(fence ? '' : line.replace(/`[^`\n]*`/g, ''))
  }

  return visible.join('\n')
}

function normalizeTarget(raw) {
  const trimmed = raw.trim()
  const angleMatch = trimmed.match(/^<([^>]+)>/)
  const target = angleMatch?.[1] ?? trimmed.split(/\s+(?=["'])/)[0]
  return target.split('#', 1)[0].split('?', 1)[0]
}

function checkTarget(file, raw) {
  const target = normalizeTarget(raw)
  if (!target || target.startsWith('#') || /^[a-z][a-z\d+.-]*:/i.test(target)) {
    return
  }

  let decoded = target
  try {
    decoded = decodeURIComponent(target)
  } catch {
    failures.push(`${file}: invalid encoded link '${raw}'`)
    return
  }

  const absolute = decoded.startsWith('/')
    ? resolve(root, decoded.slice(1))
    : resolve(root, dirname(file), decoded)
  const repositoryPath = relative(root, absolute)
  if (repositoryPath === '..' || repositoryPath.startsWith(`..${sep}`)) {
    failures.push(`${file}: local reference escapes repository '${raw}'`)
    return
  }

  if (!existsSync(absolute)) {
    failures.push(`${file}: broken local reference '${raw}'`)
  }
}

for (const file of documents) {
  const content = stripCode(readFileSync(resolve(root, file), 'utf8'))
  for (const match of content.matchAll(markdownLinks)) checkTarget(file, match[1])
  for (const match of content.matchAll(referenceLinks)) checkTarget(file, match[1])
  for (const match of content.matchAll(htmlLinks)) checkTarget(file, match[1])
}

if (failures.length > 0) {
  for (const failure of failures.sort()) console.error(`[docs-check] ${failure}`)
  process.exit(1)
}

console.log(`[docs-check] OK (${documents.length} documentation files checked)`)
```

Add:

```json
{
  "scripts": {
    "docs:check": "pnpm readme:check && node scripts/check-docs.mjs"
  }
}
```

- [ ] **Step 2: Run the documentation RED gate**

```bash
pnpm docs:check
```

Expected: FAIL only on the current missing `docs/assets/demo-preview.gif`. The legacy documents and `examples/` references still resolve at this point because their deletion and replacement happen later in this task.

- [ ] **Step 3: Create the consolidated contributor guide**

Create `CONTRIBUTING.md` with these exact sections and requirements:

````markdown
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
````

- [ ] **Step 4: Create the consolidated release guide**

Create `docs/RELEASING.md` with:

````markdown
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
````

- [ ] **Step 5: Create the concise skill-system guide**

Create `.agents/README.md`:

````markdown
# ZuSound Agent Skills

Canonical reusable skills live in `.agents/skills/zusound-onboarding/`; the other skill IDs use the same directory layout.

Each skill contains:

- `SKILL.md` with `name` and `description` frontmatter
- one or more `references/*.md` files

Current skills:

- `zusound-onboarding`
- `zusound-tuning`
- `zusound-debugging`
- `zusound-migration`

Validate and generate the local Claude bridge with:

```bash
pnpm skills:validate
pnpm skills:bridge
```

`.claude/skills/` is generated local output and must not be committed. Do not include secrets, personal data, absolute machine paths, or unreproducible tooling assumptions in canonical skill files.
````

- [ ] **Step 6: Replace the demo README**

Create `demo/README.md`:

````markdown
# ZuSound Demo

This private React, TypeScript, and Vite workspace is the integration demo and GitHub Pages site for ZuSound.

## Run locally

```bash
pnpm demo:dev
```

Open `http://localhost:5173` and enable audio through the page's user-gesture control.

## Validate

```bash
pnpm demo:typecheck
pnpm demo:build
```

The demo covers state-change triggers, aesthetic controls, rapid updates, middleware/subscriber guidance, and the public options reference. Vite uses relative asset paths so `demo/dist` can be deployed under the repository's GitHub Pages subpath.
````

- [ ] **Step 7: Update root and package README references**

In root `README.md`:

- Delete the entire centered preview `<p>` block containing the missing GIF. Keep the existing interactive-demo link immediately below it.
- Replace `Launch Checklist` with:

  ````markdown
  ## Launch Checklist

  Before opening a pull request or tagging a release:

  ```bash
  pnpm verify
  ```

  See [Releasing ZuSound](docs/RELEASING.md) for publishing prerequisites and rollback.
  ````

- Replace `Docs Map` with:

  ```markdown
  ## Docs Map

  - [Contributing](CONTRIBUTING.md)
  - [Package API and recipes](packages/zusound/README.md)
  - [Demo development](demo/README.md)
  - [Release process](docs/RELEASING.md)
  - [Agent skills](.agents/README.md)
  - [Security policy](SECURITY.md)
  - [Code of conduct](CODE_OF_CONDUCT.md)
  ```

- Keep the four skill names and validation commands. Replace the final bridge-loading sentence with `See [.agents/README.md](.agents/README.md) for the canonical skill layout, validation, bridge generation, and artifact policy.`
- Replace the entire `Demo` section with:

  ````markdown
  ## Demo

  [Open the hosted Signal Lab](https://joe-byounghern-kim.github.io/zusound/).

  Run the same React and Vite application locally:

  ```bash
  pnpm demo:dev
  ```

  Open `http://localhost:5173`. For workspace details, see [demo/README.md](demo/README.md). Pages deployment is automated by `.github/workflows/deploy-demo.yml`.
  ````

This removes every `examples/`, legacy server/staging, second-demo, and deleted-document reference from the root README.

In `packages/zusound/README.md`, replace `Related Docs` with:

```markdown
## Related Docs

- [Project overview](https://github.com/joe-byounghern-kim/zusound/blob/main/README.md)
- [Contributing](https://github.com/joe-byounghern-kim/zusound/blob/main/CONTRIBUTING.md)
- [Demo](https://github.com/joe-byounghern-kim/zusound/blob/main/demo/README.md)
- [Releasing](https://github.com/joe-byounghern-kim/zusound/blob/main/docs/RELEASING.md)
```

- [ ] **Step 8: Simplify the PR template**

Replace `.github/PULL_REQUEST_TEMPLATE.md` with:

```markdown
## Summary

- Describe what changed and why.

## Verification

- [ ] Relevant local checks passed.
- [ ] Public API/type changes include tests and synchronized package/demo docs.
- [ ] Demo changes were checked for keyboard use, responsive layout, and audio activation.
- [ ] A Changeset is included, or the PR explains why none is required.
```

- [ ] **Step 9: Delete superseded and misleading documents**

```bash
git rm .env.example QUICK_START.md REQUIREMENTS.MD DEVELOPMENT.md
git rm docs/CONTRIB.md docs/QA_CHECKLIST.md docs/RUNBOOK.md docs/RELEASE_GATES.md
git rm docs/AGENT_SKILLS_ADOPTION.md docs/SKILL_ROLLOUT.md docs/SKILL_ARTIFACT_POLICY.md docs/SKILL_MIGRATION_REHEARSAL.md
git rm docs/superpowers/plans/2026-08-01-dependency-and-project-cleanup.md docs/superpowers/specs/2026-08-01-dependency-and-project-cleanup-design.md
git rm docs/assets/.gitkeep
```

All current contributor, release, skill, demo, and quick-start information must already exist in retained files before this step.

- [ ] **Step 10: Synchronize and verify documentation**

```bash
pnpm exec prettier --write scripts/check-docs.mjs CONTRIBUTING.md docs/RELEASING.md .agents/README.md demo/README.md README.md packages/zusound/README.md .github/PULL_REQUEST_TEMPLATE.md
pnpm readme:sync
pnpm exec prettier --write README.md packages/zusound/README.md
pnpm docs:check
pnpm skills:validate
```

Expected: README synchronization passes, all maintained local references exist, and four skills validate.

- [ ] **Step 11: Commit documentation consolidation**

```bash
git add package.json scripts/check-docs.mjs CONTRIBUTING.md docs/RELEASING.md .agents/README.md demo/README.md README.md packages/zusound/README.md .github/PULL_REQUEST_TEMPLATE.md
git diff --cached --name-only
git commit -m "docs: consolidate project guidance"
```

The staged list must contain only the nine retained files above plus the exact deletions staged by Step 9. Do not use a broad `git add -u docs`; it could capture unrelated documentation or planning-file changes.

---

### Task 6: Add dead-code, formatting, and package-publication gates

**Files:**

- Create: `knip.json`
- Create: `.prettierignore`
- Create: `scripts/check-outdated.mjs`
- Create: `scripts/check-package.mjs`
- Modify: `package.json`
- Modify: `packages/zusound/package.json`
- Format: `demo/index.html`
- Format: `demo/src/app.css`
- Format: `demo/src/components/AudioGate.tsx`
- Format: `demo/src/components/CodeBlock.tsx`
- Format: `demo/src/sections/ApiDocs.tsx`
- Format: `demo/src/sections/Hero.tsx`
- Format: `demo/src/store.ts`
- Format: `packages/zusound/src/types.ts`
- No other planned files; an unexpected Knip or formatting finding blocks this task until the plan is corrected before editing another file.

**Interfaces:**

- Consumes: final workspace paths and retained documents from Tasks 3-5.
- Produces: `pnpm deps:check`, `pnpm format:check`, `pnpm knip`, `pnpm package:check`, and `pnpm verify` as deterministic local/CI gates.

- [ ] **Step 1: Configure Knip for the final workspace**

Create `knip.json`:

```json
{
  "$schema": "https://unpkg.com/knip@6/schema.json",
  "treatConfigHintsAsErrors": true,
  "workspaces": {
    ".": {
      "entry": ["eslint.config.js", "scripts/*.mjs"],
      "project": ["eslint.config.js", "scripts/*.mjs"],
      "ignoreBinaries": ["action-validator", "validate-dependabot-yaml"],
      "ignoreDependencies": [
        "@action-validator/cli",
        "@action-validator/core",
        "@bugron/validate-dependabot-yaml"
      ]
    },
    "packages/zusound": {
      "entry": ["src/index.ts", "tsup.config.ts", "vitest.config.ts"],
      "project": ["src/**/*.ts", "__tests__/**/*.ts", "*.config.ts"],
      "ignoreDependencies": ["vite"]
    },
    "demo": {
      "entry": ["src/main.tsx", "vite.config.ts"],
      "project": ["src/**/*.{ts,tsx}", "vite.config.ts"],
      "includeEntryExports": true
    }
  }
}
```

The root automation validators are intentional binary-only dependencies invoked through `execFileSync`, which Knip cannot infer statically, so list both binaries and their packages explicitly. Vite is the only package-workspace ignored dependency because it satisfies Vitest's non-optional peer and is also used by the package's test configuration graph.

- [ ] **Step 2: Configure repository formatting exclusions**

Create `.prettierignore`:

```text
**/coverage
**/dist
**/node_modules
**/.turbo
pnpm-lock.yaml
```

- [ ] **Step 3: Add the package-content validator**

Create `scripts/check-package.mjs`:

```js
#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

const packageDir = resolve(process.cwd(), 'packages/zusound')
const result = JSON.parse(
  execFileSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: packageDir,
    encoding: 'utf8',
  })
)

const expected = [
  'LICENSE',
  'README.md',
  'dist/index.cjs',
  'dist/index.cjs.map',
  'dist/index.d.cts',
  'dist/index.d.ts',
  'dist/index.js',
  'dist/index.js.map',
  'package.json',
]

const actual = result[0].files.map(({ path }) => path).sort()
const wanted = [...expected].sort()
if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
  console.error('[package-check] Unexpected package files')
  console.error(JSON.stringify({ expected: wanted, actual }, null, 2))
  process.exit(1)
}

console.log(`[package-check] OK (${actual.length} files)`)
```

- [ ] **Step 4: Add the deterministic outdated-dependency allowlist**

Create `scripts/check-outdated.mjs`:

```js
#!/usr/bin/env node

import { spawnSync } from 'node:child_process'

const allowed = new Map([
  ['@types/node', /^24\./],
  ['typescript', /^5\.9\./],
])
const pnpmCli = process.env.npm_execpath
if (!pnpmCli) {
  console.error('[dependency-check] Run this checker through pnpm deps:check')
  process.exit(1)
}

const result = spawnSync(
  process.execPath,
  [pnpmCli, '--reporter=silent', 'outdated', '--recursive', '--format', 'json'],
  {
    cwd: process.cwd(),
    encoding: 'utf8',
  }
)

if (result.error || ![0, 1].includes(result.status)) {
  console.error(
    `[dependency-check] Unable to run pnpm outdated: ${result.error?.message ?? `exit ${result.status}`}`
  )
  process.exit(1)
}

let outdated
try {
  outdated = result.stdout.trim() ? JSON.parse(result.stdout) : {}
} catch {
  console.error('[dependency-check] pnpm outdated did not return valid JSON')
  if (result.stdout.trim()) console.error(result.stdout.trim())
  process.exit(1)
}

const names = Object.keys(outdated).sort()
const unexpected = names.filter((name) => !allowed.has(name))
const missing = [...allowed.keys()].filter((name) => !(name in outdated))
const invalid = names.filter((name) => {
  const entry = outdated[name]
  const currentPattern = allowed.get(name)
  return currentPattern && (!currentPattern.test(entry.current) || entry.current !== entry.wanted)
})

if (unexpected.length > 0 || missing.length > 0 || invalid.length > 0) {
  console.error('[dependency-check] Outdated dependency allowlist mismatch')
  console.error(JSON.stringify({ unexpected, missing, invalid, outdated }, null, 2))
  process.exit(1)
}

console.log(
  `[dependency-check] OK (${names.map((name) => `${name}=${outdated[name].current}`).join(', ')})`
)
```

The checker accepts pnpm's expected exit code `1` when intentionally constrained majors exist, requires the exact two-name allowlist, and additionally requires `current === wanted` so compatible patch/minor updates cannot hide behind the allowlist. It was validated RED on the current dependency graph and GREEN on the final graph with only `@types/node@24.13.3` and `typescript@5.9.3` outstanding.

- [ ] **Step 5: Add aggregate quality scripts**

Set these root scripts:

```json
{
  "scripts": {
    "deps:check": "node scripts/check-outdated.mjs",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "knip": "knip --reporter compact",
    "package:check": "node scripts/check-package.mjs && publint run packages/zusound --strict --level warning && attw --pack packages/zusound",
    "security:check": "node scripts/check-audit.mjs",
    "verify": "pnpm format:check && pnpm security:check && pnpm deps:check && pnpm docs:check && pnpm skills:validate && pnpm knip && pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm build && pnpm package:check"
  }
}
```

- [ ] **Step 6: Run Knip and require zero unexplained findings**

```bash
pnpm knip
```

Expected: no findings after the planned dependency, demo, public-entry, and documentation cleanup. The only intentional direct-package exception is Vite, documented by `ignoreDependencies` because Vitest declares it as a non-optional peer. If Knip reports anything else, stop this task, identify which earlier task owns the finding, update this plan with the exact file and change, then resume. Do not ignore public package entry exports and do not add broad file ignores.

Re-run until:

```text
0 unused files
0 unexplained unused dependencies
0 unexplained unused exports
```

- [ ] **Step 7: Capture formatting RED, format the eight known files, and verify no drift**

```bash
pnpm format:check
```

Expected RED: after Task 5 formats all changed documentation, Prettier reports exactly the eight retained files listed for formatting in this task. The list was measured with Prettier 3.9.6 against the upgraded prototype.

```bash
pnpm exec prettier --write demo/index.html demo/src/app.css demo/src/components/AudioGate.tsx demo/src/components/CodeBlock.tsx demo/src/sections/ApiDocs.tsx demo/src/sections/Hero.tsx demo/src/store.ts packages/zusound/src/types.ts
pnpm format:check
pnpm lint
pnpm typecheck
```

Expected: all pass; formatting changes affect retained files only.

- [ ] **Step 8: Capture package-validation RED and correct conditional declarations**

```bash
pnpm -C packages/zusound build
pnpm package:check
```

Expected RED: the nine-file assertion passes, then Publint reports that `exports["."].types` is interpreted as ESM under the `require` condition because the current single declaration condition points CommonJS consumers at `index.d.ts`.

Replace only `packages/zusound/package.json#exports` with:

```json
{
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    }
  }
}
```

Keep the legacy-compatible top-level `main`, `module`, and `types` fields unchanged. Do not add a published-package Node engine solely to silence Publint's suggestion; the browser library's ES2020 artifact supports a broader consumer range than its Node 22 development toolchain.

Run again:

```bash
pnpm package:check
```

Expected GREEN:

- Exact nine-file tarball list.
- Publint strict warning-level validation passes without outputting the intentionally excluded Node-engine suggestion.
- `attw --pack packages/zusound` passes with no package export/type errors.

This exact export map was validated against Publint 0.3.23, ATTW 0.18.5, and the generated nine-file tarball.

- [ ] **Step 9: Commit quality gates**

```bash
git add knip.json .prettierignore scripts/check-outdated.mjs scripts/check-package.mjs package.json packages/zusound/package.json demo/index.html demo/src/app.css demo/src/components/AudioGate.tsx demo/src/components/CodeBlock.tsx demo/src/sections/ApiDocs.tsx demo/src/sections/Hero.tsx demo/src/store.ts packages/zusound/src/types.ts
git commit -m "chore: add repository integrity gates"
```

---

### Task 7: Update CI, release, deployment, and dependency automation

**Files:**

- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/deploy-demo.yml`
- Modify: `.github/workflows/release-check.yml`
- Modify: `.github/workflows/release.yml`
- Create: `.github/dependabot.yml`
- Create: `scripts/check-automation.mjs`
- Modify: `package.json`

**Interfaces:**

- Consumes: root `verify`, `package:check`, final `demo/dist`, pnpm 11, and package tarball from prior tasks.
- Produces: immutable current Actions, Node 22/24 quality, tarball consumer compatibility across Zustand 4/5, direct Vite demo deployment, grouped weekly updates, and `pnpm automation:check` schema validation.

- [ ] **Step 1: Replace all action revisions with current immutable pins**

Use these exact revisions and comments everywhere they occur:

```yaml
uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
uses: pnpm/action-setup@ff378ebe6b225b0680b81c1ad4498ae0d1d3a5e3 # v6.0.10
uses: actions/configure-pages@45bfe0192ca1faeb007ade9deae92b16b8254a0d # v6.0.0
uses: actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9 # v5.0.0
uses: actions/deploy-pages@cd2ce8fcbc39b97be8ca5fce6e763baed58fa128 # v5.0.0
```

- [ ] **Step 2: Replace CI quality and compatibility jobs**

Keep push/PR triggers, read permissions, and concurrency. Set quality matrix:

```yaml
strategy:
  fail-fast: false
  matrix:
    node-version: [22.22.2, 24.19.0]
```

After frozen install, run:

```yaml
- name: Verify repository
  run: pnpm verify

- name: Validate automation schemas
  run: pnpm automation:check

- name: Security audit
  run: pnpm security:check
```

Delete `library-node18` completely.

Replace the current workspace-mutating Zustand job with a tarball consumer matrix:

```yaml
package-consumer:
  name: Package consumer (Zustand ${{ matrix.zustand-version }})
  runs-on: ubuntu-latest
  strategy:
    fail-fast: false
    matrix:
      zustand-version: [4.0.0, 4.5.7, 5.0.14]
  steps:
    - name: Checkout
      uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1

    - name: Setup pnpm
      uses: pnpm/action-setup@ff378ebe6b225b0680b81c1ad4498ae0d1d3a5e3 # v6.0.10

    - name: Setup Node.js
      uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
      with:
        node-version: 24.19.0
        cache: pnpm

    - name: Install and build
      run: |
        pnpm install --frozen-lockfile
        pnpm -C packages/zusound build

    - name: Pack package
      id: pack
      run: |
        TARBALL=$(pnpm -C packages/zusound pack --pack-destination "$RUNNER_TEMP" --json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>process.stdout.write(JSON.parse(s).filename))")
        echo "tarball=$TARBALL" >> "$GITHUB_OUTPUT"

    - name: Install consumer fixture
      working-directory: ${{ runner.temp }}
      run: |
        mkdir consumer
        cd consumer
        npm init -y
        npm pkg set type=module
        npm install "${{ steps.pack.outputs.tarball }}" "zustand@${{ matrix.zustand-version }}" typescript@5.9.3
        cat > smoke.mjs <<'EOF'
        import * as vanilla from 'zustand/vanilla'
        import { createZusound, version, zusound } from 'zusound'

        const createStore = vanilla.createStore ?? vanilla.default
        const store = createStore(zusound(() => ({ count: 0 }), { enabled: false }))
        const instance = createZusound({ enabled: false })
        const unsubscribe = store.subscribe(instance)
        unsubscribe()
        instance.cleanup()
        if (typeof version !== 'string' || version.length === 0) process.exit(1)
        EOF
        node smoke.mjs

        cat > smoke.cjs <<'EOF'
        const vanilla = require('zustand/vanilla')
        const { createZusound, version, zusound } = require('zusound')

        const createStore = vanilla.createStore ?? vanilla.default ?? vanilla
        const store = createStore(zusound(() => ({ count: 0 }), { enabled: false }))
        const instance = createZusound({ enabled: false })
        const unsubscribe = store.subscribe(instance)
        unsubscribe()
        instance.cleanup()
        if (typeof version !== 'string' || version.length === 0) process.exit(1)
        EOF
        node smoke.cjs

        cat > smoke.ts <<'EOF'
        import type { StateCreator } from 'zustand/vanilla'
        import { createZusound, version, zusound } from 'zusound'

        type State = { count: number }
        const initializer: StateCreator<State, [], []> = () => ({ count: 0 })
        const enhanced: StateCreator<State, [], []> = zusound(initializer, { enabled: false })
        const subscriber = createZusound({ enabled: false })
        const listener: (state: State, previousState: State) => void = subscriber

        void enhanced
        void listener
        void version
        subscriber.cleanup()
        EOF

        cat > tsconfig.json <<'EOF'
        {
          "compilerOptions": {
            "target": "ES2020",
            "module": "NodeNext",
            "moduleResolution": "NodeNext",
            "strict": true,
            "noEmit": true,
            "skipLibCheck": false
          },
          "include": ["smoke.ts"]
        }
        EOF
        ./node_modules/.bin/tsc -p tsconfig.json
```

- [ ] **Step 3: Finalize direct Vite demo deployment**

Use Node `24.19.0` and a frozen install. Build `packages/zusound` first, then run `pnpm -C demo typecheck` and `pnpm -C demo build`. Upload `./demo/dist`. Preserve Pages permissions, environment, and concurrency. The explicit library build is required because the demo resolves the workspace package through its generated `dist` exports on a clean runner.

- [ ] **Step 4: Update release-check**

Use Node `24.19.0` and current action pins. Keep README/docs check, automatic release dry-run, build, and replace the old pack dry-run with:

```yaml
- name: Package validation
  run: pnpm package:check
```

- [ ] **Step 5: Update the release workflow**

Use Node `24.19.0` and current action pins. Remove the `Upgrade npm for trusted publishing` step because Node 24.19.0 ships npm 11.17.0, already above the documented `>=11.5.1` trusted-publishing floor.

Replace individual quality steps with:

```yaml
- name: Verify repository
  run: pnpm verify

- name: Validate automation schemas
  run: pnpm automation:check

- name: Security audit
  run: pnpm security:check
```

Keep tag resolution, tag checkout, ancestry guard, tag/version guard, already-published guards, OIDC/token publish paths, GitHub release creation, and job summary unchanged.

- [ ] **Step 6: Add grouped Dependabot updates**

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directories:
      - /
      - /demo
      - /packages/zusound
    schedule:
      interval: weekly
      day: monday
      time: '09:00'
      timezone: Etc/UTC
    open-pull-requests-limit: 10
    ignore:
      - dependency-name: typescript
        update-types:
          - version-update:semver-major
      - dependency-name: '@types/node'
        update-types:
          - version-update:semver-major
    groups:
      eslint:
        patterns:
          - eslint
          - '@eslint/*'
          - '@typescript-eslint/*'
          - eslint-config-prettier
          - eslint-plugin-react-hooks
          - eslint-plugin-react-refresh
          - globals
      vite:
        patterns:
          - vite
          - '@vitejs/*'
      vitest:
        patterns:
          - vitest
          - '@vitest/*'
          - jsdom
      react:
        patterns:
          - react
          - react-dom
          - '@types/react*'
      changesets:
        patterns:
          - '@changesets/*'
      automation-validation:
        patterns:
          - '@action-validator/*'
          - '@bugron/validate-dependabot-yaml'

  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
      day: monday
      time: '09:00'
      timezone: Etc/UTC
    groups:
      actions:
        patterns:
          - '*'
```

- [ ] **Step 7: Add local workflow and Dependabot schema validation**

Create `scripts/check-automation.mjs`:

```js
#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const workflowsDir = resolve(root, '.github/workflows')
const workflows = readdirSync(workflowsDir)
  .filter((file) => file.endsWith('.yml') || file.endsWith('.yaml'))
  .sort()

for (const workflow of workflows) {
  execFileSync('action-validator', [`.github/workflows/${workflow}`], {
    cwd: root,
    stdio: 'inherit',
  })
}

execFileSync('validate-dependabot-yaml', ['.github/dependabot.yml'], {
  cwd: root,
  stdio: 'inherit',
})

console.log(`[automation-check] OK (${workflows.length} workflows and Dependabot config)`)
```

Add the script without placing it inside the deterministic core `verify` chain:

```json
{
  "scripts": {
    "automation:check": "node scripts/check-automation.mjs"
  }
}
```

The latest pinned npm tools were prototyped successfully against all four repository workflows and the planned Dependabot file. The Dependabot validator checks the official live v2 SchemaStore schema plus duplicate-directory and ecosystem-specific rules, so this separate gate requires network access and fails closed rather than making offline `pnpm verify` flaky.

- [ ] **Step 8: Validate automation schemas and repository gates**

```bash
pnpm exec prettier --check .github/workflows .github/dependabot.yml scripts/check-automation.mjs package.json
pnpm automation:check
pnpm verify
pnpm security:check
```

Expected: Prettier parses the YAML and script, Action Validator schema-checks every workflow, the Dependabot validator accepts the grouped update policy, full verification passes, and the explicit security checker reports zero at all five severities.

- [ ] **Step 9: Commit automation updates**

```bash
git add .github/workflows/ci.yml .github/workflows/deploy-demo.yml .github/workflows/release-check.yml .github/workflows/release.yml .github/dependabot.yml scripts/check-automation.mjs package.json
git commit -m "ci: modernize repository automation"
```

---

### Task 8: Run clean-install, tarball, and browser acceptance verification

**Files:**

- No planned new files
- No planned modifications; a failed check reopens the Task 1-7 step that owns the affected file.

**Interfaces:**

- Consumes: the completed final tree and all root quality scripts.
- Produces: acceptance evidence for every specification criterion and a clean, reviewable branch.

- [ ] **Step 1: Verify the full repository on Node 24 LTS**

```bash
rm -rf node_modules packages/zusound/node_modules demo/node_modules packages/zusound/dist packages/zusound/coverage demo/dist .turbo packages/zusound/.turbo demo/.turbo
COREPACK_ENABLE_DOWNLOAD_PROMPT=0 mise exec node@24.19.0 -- corepack pnpm install --frozen-lockfile
COREPACK_ENABLE_DOWNLOAD_PROMPT=0 mise exec node@24.19.0 -- corepack pnpm verify
COREPACK_ENABLE_DOWNLOAD_PROMPT=0 mise exec node@24.19.0 -- corepack pnpm automation:check
COREPACK_ENABLE_DOWNLOAD_PROMPT=0 mise exec node@24.19.0 -- corepack pnpm security:check
```

Expected: only exact generated dependency, build, coverage, and Turbo-cache paths are removed in the isolated worktree; fresh install and verify exit zero; audit contains zero findings at every severity.

- [ ] **Step 2: Verify the minimum Node runtime**

```bash
rm -rf node_modules packages/zusound/node_modules demo/node_modules packages/zusound/dist packages/zusound/coverage demo/dist .turbo packages/zusound/.turbo demo/.turbo
COREPACK_ENABLE_DOWNLOAD_PROMPT=0 mise exec node@22.22.2 -- corepack pnpm install --frozen-lockfile
COREPACK_ENABLE_DOWNLOAD_PROMPT=0 mise exec node@22.22.2 -- corepack pnpm verify
COREPACK_ENABLE_DOWNLOAD_PROMPT=0 mise exec node@22.22.2 -- corepack pnpm automation:check
```

Expected: the complete deterministic quality suite passes on Node 22.22.2.

- [ ] **Step 3: Confirm only intentional outdated constraints remain**

```bash
pnpm deps:check
pnpm why esbuild
pnpm why nanoid
```

The dependency checker parses pnpm's JSON and requires the exact two-entry allowlist:

- TypeScript 5.9 versus TypeScript 7.
- `@types/node` 24 versus Node 26 typings.

It also requires `current === wanted` for both entries, so a compatible TypeScript 5.9 or Node 24 typings update fails the gate. `pnpm why esbuild` and `pnpm why nanoid` must separately show the intentional transitive overrides at `0.28.1` and `3.3.18`; neither is expected in the direct outdated report.

No other direct production or development dependency remains behind its stable compatible release.

- [ ] **Step 4: Run the consolidated demo in a browser**

Build the demo, then start the preview through the shell tool as a background task so no interactive shell is required:

```bash
pnpm demo:build
nohup pnpm -C demo preview --host 127.0.0.1 --port 4173 > "$JCODE_SCRATCH_DIR/zusound-demo-preview.log" 2>&1 &
echo $! > "$JCODE_SCRATCH_DIR/zusound-demo-preview.pid"
```

Use browser automation against `http://127.0.0.1:4173` and verify:

1. Page loads with no console errors or missing network assets.
2. Audio activation control is visible and responds to a user gesture.
3. Increment, toggle, add, remove, and burst controls update live state/log output.
4. Aesthetic controls remain enabled after audio activation.
5. Middleware and subscriber guidance is visible.
6. API option documentation renders.
7. Keyboard focus is visible on controls.
8. Layout remains readable at desktop and 375px viewport widths.

Stop the preview process after evidence is recorded:

```bash
kill "$(cat "$JCODE_SCRATCH_DIR/zusound-demo-preview.pid")"
rm -f "$JCODE_SCRATCH_DIR/zusound-demo-preview.pid" "$JCODE_SCRATCH_DIR/zusound-demo-preview.log"
```

- [ ] **Step 5: Verify package contents and consumers one final time**

```bash
pnpm -C packages/zusound build
pnpm package:check
```

Then reproduce all three CI tarball consumer checks locally for Zustand `4.0.0`, `4.5.7`, and `5.0.14` in scratch directories. Expected: ESM import, CommonJS require, strict TypeScript middleware/subscriber assignment, middleware creation, subscriber attach/unsubscribe, cleanup, and `version` access succeed for all three. The exact nine mode/version combinations were validated during planning.

- [ ] **Step 6: Inspect final repository cleanliness**

```bash
git diff --check
git status --short
git log --oneline --decorate -10
```

Expected:

- No generated `dist`, coverage, tarball, or temporary fixture is tracked.
- No unrelated files changed.
- Each task has its own commit.
- The branch contains the pre-existing design and implementation-plan commits plus the task-specific implementation commits.

- [ ] **Step 7: Close any failed gate under its owning task**

Do not create a generic verification commit. If a gate fails, reopen the Task 1-7 step that owns the affected file, record the exact correction in this plan, apply it, rerun the narrow gate and the complete Node 24 `pnpm verify`, and commit it with that task's specific message. If no files changed, do not create an empty commit.
