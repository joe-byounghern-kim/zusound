# Skill Migration Rehearsal

## Date

2026-03-05

## Scope

- Establish canonical `.agents/skills/` structure.
- Add reusable template and pilot production-grade skill.
- Validate skill contract and CI guardrails.
- Generate local `.claude/skills/` bridge output.

## Commands

```bash
pnpm skills:validate
pnpm skills:bridge
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm build
```

## Result

Pass.

- `pnpm skills:check` (negative path): fails when `description` frontmatter is removed.
- `pnpm skills:check` (positive path, Phase 16 baseline): `[skills-check] OK (2 skills validated)`.
- `pnpm skills:bridge` (Phase 16 baseline): `[skills-bridge] Generated 2 local bridge files in .claude/skills`.
- Full gates passed: `pnpm skills:validate`, `pnpm lint`, `pnpm typecheck`, `pnpm test:coverage`, `pnpm build`.

## Phase 17 User-Facing Skill Rehearsal

### Scope

- Validate four user-facing skills: onboarding, tuning, debugging, migration.
- Verify canonical distribution path (`.agents/skills` -> `.claude/skills`).
- Capture deterministic dry-run outcomes and one negative-path remediation flow.

### Commands

```bash
pnpm skills:validate
pnpm skills:bridge
```

### Dry-Run Outcomes

- `zusound-onboarding`: PASS. First-signal integration path is deterministic with explicit rollback hint.
- `zusound-tuning`: PASS. Stepwise parameter loop and baseline comparison path are explicit.
- `zusound-debugging`: PASS. Symptom-first branch order resolves no-sound and burst cases.
- `zusound-migration`: PASS. Pilot-first staged rollout and rollback checkpoints are explicit.

### Negative Path Rehearsal

- Scenario: missing user gesture causes initial no-sound symptom.
- Remediation path (debugging/onboarding refs): unlock via user interaction, retry deterministic trigger.
- Result: PASS after remediation; path is clear and bounded.
