---
name: zusound-tuning
description: Tune Zusound aesthetics and playback behavior with a repeatable calibration loop and measurable checkpoints.
---

# Zusound Tuning

## When To Use

- Integration works, but audio behavior feels too noisy, too subtle, or mood-mismatched.
- A team needs reproducible before/after tuning evidence.

## Inputs Required

- Current options (`volume`, `debounceMs`, `aesthetics`, `performanceMode`).
- Product intent (calm, neutral, energetic, high-alert).
- One repeatable state-change scenario for A/B comparison.

## Procedure

1. Baseline: capture current settings and run one repeatable scenario.
2. Adjust in bounded sequence:
   - Dynamics: `volume`, `debounceMs`.
   - Character: `pleasantness`, `brightness`, `valence`.
   - Motion: `arousal`, `simultaneity`, optional `duration`.
3. Change one variable group at a time and compare against baseline.
4. For high-frequency apps, test with and without `performanceMode`.
5. Freeze a candidate profile and record why it is preferred.

## Stop Conditions

- Stop when a selected profile is better than baseline in the same scenario.
- Stop if contradictory changes appear; roll back to last known good profile.

## Verification

- `pnpm skills:validate`
- `pnpm skills:bridge`

## References

- `references/compatibility.md`
- `references/config-examples.md`
- `references/troubleshooting.md`
