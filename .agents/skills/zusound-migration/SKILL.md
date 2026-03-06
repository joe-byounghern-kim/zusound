---
name: zusound-migration
description: Migrate existing Zustand stores to Zusound incrementally with phase gates, rollback steps, and verification checkpoints.
---

# Zusound Migration

## When To Use

- A team already has production Zustand stores and wants low-risk Zusound adoption.
- Big-bang replacement is not acceptable.

## Inputs Required

- Candidate pilot store and traffic profile.
- Current store initialization pattern and middleware stack.
- Rollback owner and acceptable rollback window.

## Procedure

1. Preflight: choose one low-risk pilot store and capture baseline behavior.
2. Phase 1 (pilot): add Zusound with conservative options and verify in development.
3. Phase 2 (expanded): roll out to additional stores with same verification checkpoints.
4. Phase 3 (stabilize): document final defaults and migration guardrails.
5. At each phase, keep explicit rollback steps ready.

## Stop Conditions

- Stop when the chosen rollout scope is complete and all phase checks pass.
- Roll back immediately when regressions exceed agreed threshold.

## Verification

- `pnpm skills:validate`
- `pnpm skills:bridge`

## References

- `references/compatibility.md`
- `references/config-examples.md`
- `references/troubleshooting.md`
