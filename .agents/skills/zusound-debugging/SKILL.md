---
name: zusound-debugging
description: Diagnose Zusound failures through symptom-first checks, branch decisions, and deterministic remediation steps.
---

# Zusound Debugging

## When To Use

- Audio feedback is missing, unstable, or unexpectedly frequent.
- A user needs a shortest-path diagnosis before deeper tuning or migration.

## Inputs Required

- Symptom summary (no sound, delayed sound, distorted behavior, burst spam).
- Integration mode (middleware or subscriber).
- Runtime context (dev/prod, browser environment, user interaction state).

## Procedure

1. Classify symptom:
   - A: no sound ever
   - B: only first event fails
   - C: too many events
   - D: wrong mood/character
2. Run branch checks in order:
   - Environment gate (`enabled`, production safety, user gesture unlock).
   - Wiring gate (store wrap/subscribe path, lifecycle cleanup).
   - Throughput gate (debounce and update frequency).
   - Mapping gate (`mapChangeToAesthetics`, `soundMapping` collisions).
3. Apply one remediation at a time and rerun the same symptom trigger.
4. Record successful fix path and final configuration.

## Stop Conditions

- Stop when symptom is resolved and repro no longer fails.
- Escalate when all branches pass but symptom persists.

## Verification

- `pnpm skills:validate`
- `pnpm skills:bridge`

## References

- `references/compatibility.md`
- `references/config-examples.md`
- `references/troubleshooting.md`
