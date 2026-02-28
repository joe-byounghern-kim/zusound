# QA Checklist for Zusound Demo

## Manual Validation

### 1. Audio Activation

- [ ] Load demo page. Audio status should be "Audio is locked".
- [ ] Click "Enable Audio". Status should change to "Audio is ready".
- [ ] Verify no errors in console.

### 2. Scene 1: State Triggers

- [ ] Toggle "Sound" switch. Verify "Audio is ready" / "Audio is locked".
- [ ] Toggle between "Middleware" and "Subscriber" modes.
- [ ] In both modes, click "Increment (+)". Should hear a neutral sound.
- [ ] In both modes, click "Add Item". Should hear a brighter/consonant sound.
- [ ] In both modes, click "Remove Item". Should hear a darker/tense sound.
- [ ] Verify "Action Log" updates with timestamps and event types.

### 3. Scene 2: Aesthetic Mapping

- [ ] Navigate to Scene 2.
- [ ] Apply "Calm" preset. Sliders should move.
- [ ] Apply "Chaotic" preset. Sliders should move.
- [ ] Manually adjust "Pleasantness" slider.
- [ ] Trigger sounds (e.g. go back to Scene 1 or use buttons if available) to hear changes.

### 4. Scene 3: Timing and Throughput

- [ ] Navigate to Scene 3.
- [ ] Click "Stress Test". Should hear a burst of random sounds.
- [ ] Click "Stop Stress Test". Sounds should stop.
- [ ] Click "Simulate API". Button should disable, then re-enable with a sound.

### 4.5 Scene 4: API Docs

- [ ] Navigate to Scene 4 using chip click and prev/next controls.
- [ ] Scene indicator shows 4 total scenes and correct scene title.
- [ ] `ZusoundOptions` table names/types/defaults match `packages/zusound/src/types.ts` and `packages/zusound/README.md`.
- [ ] `AestheticParams` table includes canonical fields and consistent descriptions.
- [ ] Usage and recipe snippets are legible, copy-friendly, and horizontally scrollable when needed.
- [ ] Demo mode note accurately explains local SSE vs hosted simulation.
- [ ] Snippets/examples have no stale option or parameter names.

### 5. Static / Hosted Mode

- [ ] Verify mode badge shows `Hosted simulation` on GitHub Pages.
- [ ] Verify deterministic hosted events appear in Action Log.
- [ ] Verify no 404 errors for `/events` in network tab (handled by code).
- [ ] Verify all assets (JS, CSS) load correctly (no 404s).

### 6. Responsive and Accessibility

- [ ] API docs scene readability verified at 1200px, 980px, 760px, and 375px.
- [ ] Tables/snippets are scrollable and not clipped at narrow widths.
- [ ] Focus-visible states are preserved on scene controls, links, and the sound switch.

### 7. Regression and Runtime Sanity

- [ ] Existing scenes (1-3) still behave as before.
- [ ] No runtime JS errors are introduced by Scene 4 additions.

## Automated Checks

- [ ] `pnpm demo:verify` passes in CI.
- [ ] `pnpm demo:react:typecheck` passes in CI.

## API Docs Drift Audit (Release/PR)

- [ ] If API surface changed, demo API docs were updated in the same PR.
- [ ] Reviewer confirmed: "Demo API docs synchronized with canonical API docs".
- [ ] Quick row-by-row spot-check completed for `ZusoundOptions` and `AestheticParams` against canonical sources.

## README Sync Rehearsal (Phase 16)

- [ ] Negative test: intentionally modify one line inside a root managed README sync section.
- [ ] `pnpm readme:check` fails with remediation message `Run: pnpm readme:sync`.
- [ ] Run `pnpm readme:sync`; rerun `pnpm readme:check`; check passes.
- [ ] Positive flow passes full release sequence:
  - `RELEASE_RANGE=origin/main..HEAD pnpm release:auto:dry-run`
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test:coverage`
  - `pnpm build`
  - `pnpm -C packages/zusound exec npm pack --dry-run`
- [ ] Capture command outputs (or CI links) in PR description for release sign-off evidence.

## Phase 15 QA Sign-Off Log

- Date: 2026-02-25
- Scope: Tasks 69-73 (scene 4 shell/content/style + sync guardrails + sign-off)
- Result: PASS
- Evidence:
  - `pnpm test` passed
  - `pnpm build` passed
  - `pnpm demo:stage` passed
  - `pnpm demo:verify` passed (`Smoke checks passed.`)

## Phase 15 Drift Audit Record

- Date: 2026-02-25
- Scope: Task 72 dry-run checklist against canonical sources
- Canonical sources checked:
  - `packages/zusound/src/types.ts`
  - `packages/zusound/README.md`
- Demo docs checked:
  - `demo/index.html` (Scene 4 tables/snippets)
  - `demo/API_DOCS_STRATEGY.md`
- Result: PASS (no naming/type/default drift found after row-by-row check for `ZusoundOptions` and `AestheticParams`)
