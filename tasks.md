# Zusound Subscriber Support Breakdown

> Phases 1–12 completed and archived. See [.save/tasks.md](.save/tasks.md) for history.

## Phase 13: Landing Page — Interactive Demo + API Docs

Rebuild the `examples/` app into a single-page landing page with interactive playground, API reference, and polished dark theme. No new npm dependencies. Ports the design system from `demo/style.css`.

**Approach:** Single-page scroll app in `examples/` with 4 sections (Hero, Interactive Playground, API Reference, Footer). Uses plain CSS (dark theme) and `createZusound` subscriber pattern for live aesthetic tuning. Zero new dependencies.

### Infrastructure (do first — unblocks everything)

- [x] [Task 50: Landing page infrastructure — index.html, app.css, App.tsx](./tasks/50-landing-page-infrastructure.md)
- [x] [Task 51: Rewrite playground store with richer state](./tasks/51-playground-store.md)

### Components (build after infrastructure)

- [x] [Task 52: Create AudioGate component](./tasks/52-audio-gate-component.md)
- [x] [Task 53: Create ActionLog component](./tasks/53-action-log-component.md)
- [x] [Task 54: Create AestheticPanel component](./tasks/54-aesthetic-panel-component.md)
- [x] [Task 55: Create CodeBlock component](./tasks/55-code-block-component.md)

### Sections (build after components)

- [x] [Task 56: Create Demo section — interactive playground](./tasks/56-demo-section.md) (depends on Tasks 51-55)
- [x] [Task 57: Create Hero section](./tasks/57-hero-section.md)
- [x] [Task 58: Create API Reference section](./tasks/58-api-docs-section.md) (depends on Task 55)
- [x] [Task 59: Create Footer section](./tasks/59-footer-section.md)

### Integration & Polish

- [x] [Task 60: Wire all sections into App.tsx](./tasks/60-wire-app-sections.md) (depends on Tasks 56-59)
- [x] [Task 61: Responsive audit and accessibility polish](./tasks/61-responsive-a11y-polish.md) (depends on Task 60)

---

## Phase 14: Value-Aware Audio Modulation

Make Zusound's audio expressive — sounds should encode *what* changed, *how much* it changed, and *how many* things changed. Currently `defaultAesthetics()` ignores `oldValue`/`newValue`, duration is hardcoded at 0.15s, all batch sounds fire simultaneously, and `SoundParams.duration`/`volume` exist in types but are never consumed.

**Approach:** Three composable enhancements (path identity + value modulation + batch stagger) plus a prerequisite fix, totaling ~35 net new lines across 3 source files. Zero breaking API changes.

### Prerequisite Fix (do first — unblocks duration/volume pipeline)

- [x] [Task 62: Wire SoundParams.duration & volume through applySoundMapping + playSound](./tasks/62-wire-soundparams-duration-volume.md)
- [x] [Task 63: Add duration to AestheticParams + mergeAesthetics](./tasks/63-aestheticparams-duration-field.md) (depends on Task 62)

### Enhancements (build after prerequisite; Tasks 64 and 66 are independent)

- [x] [Task 64: Path earcon identity — stable per-path pitch offset](./tasks/64-path-earcon-identity.md)
- [x] [Task 65: Value-aware modulation — delta-driven pitch, arousal, and duration](./tasks/65-value-aware-modulation.md) (depends on Task 63)
- [x] [Task 66: Batch stagger — sequence simultaneous changes as a phrase](./tasks/66-batch-stagger.md)

### Tests (after all enhancements)

- [x] [Task 67: Update existing tests and add new tests for all enhancements](./tasks/67-update-and-add-tests.md) (depends on Tasks 62-66)
