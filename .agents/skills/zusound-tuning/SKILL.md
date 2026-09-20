---
name: zusound-tuning
description: Use when a working Zusound integration needs repeatable low-volume tuning, correct duration units, and listening evidence.
compatibility: Zustand >=4.0.0 <6.0.0. Designed for the upcoming Zusound v0.3.0 lifecycle guidance.
---

# Zusound Tuning

## Use when

Use after integration and lifecycle checks pass but the optional cues are too subtle, busy, harsh, or mismatched to the product. Do not tune to compensate for broken wiring or unavailable browser activation.

## Establish a fixed scenario

1. Choose one direct click or tap that makes one known immutable top-level state update.
2. Start with `{ enabled: true, volume: 0.1 }` and record the current configuration.
3. Use the same browser, output device, action count, and debounce window for each comparison.
4. Confirm the visible state update automatically. Ask a human listener to record listening evidence separately.

See [parameter profiles and units](references/config-examples.md) and [compatibility notes](references/compatibility.md).

## Tuning loop

1. Change one parameter group per pass:
   - **Dynamics:** `volume`, then `debounceMs`.
   - **Character:** `pleasantness`, `brightness`, and `valence`.
   - **Motion:** `arousal`, `simultaneity`, and duration.
   - **Path override:** one `soundMapping` entry only after the base profile is understood.
2. Repeat the exact gesture scenario and record the option delta, automatic state result, and human listening result.
3. Keep a candidate only if it improves the defined goal without changing application state behavior.
4. Use `performanceMode` only as a separately compared throughput setting.

`AestheticParams.duration` is seconds. `soundMapping[path].duration` is milliseconds. See the unit-safe example before editing either value.

## Stop and rollback

Stop when a documented candidate meets the listening goal in the fixed scenario and consumer typecheck, tests, and build still pass. If results conflict, restore the last recorded configuration and repeat one isolated parameter group. Do not claim that automated checks established audible quality.

## References

- [Compatibility and fixed-scenario rules](references/compatibility.md)
- [Typed profiles, mapping precedence, and duration units](references/config-examples.md)
- [Tuning recovery steps](references/troubleshooting.md)
