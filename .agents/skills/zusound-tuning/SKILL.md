---
name: zusound-tuning
description: 'Use when Zusound Web Audio already works but sounds wrong: sound too loud, an upload progress cue too long, too many beeps in an intentional update stream, or a request to tune cue character, brightness, pleasantness, or duration. Compare one low-volume change at a time with correct units and separate human listening evidence. Not for first Zustand middleware audio wiring or an unexpectedly silent/broken integration.'
compatibility: Zustand >=4.0.0 <6.0.0. Browser Web Audio with explicit lifecycle ownership.
---

# Zusound Tuning

## Use when

Use after integration and lifecycle checks pass but the optional cues are too subtle, busy, harsh, or mismatched to the product. Do not tune to compensate for broken wiring or unavailable browser activation.

**Not for:** first wiring (use the zusound-onboarding skill), or wrong/silent behavior caused by wiring, activation, or duplicate listeners (use the zusound-debugging skill).

## Establish a fixed scenario

1. Choose one direct click or tap that makes one known immutable top-level state update.
2. Start with `{ enabled: true, volume: 0.1 }` and record the current configuration.
3. Use the same browser, output device, action count, and debounce window for each comparison.
4. Confirm the visible state update automatically. Ask a human listener to record listening evidence separately.

See [parameter profiles and units](references/config-examples.md) and [compatibility notes](references/compatibility.md).

## Tuning loop

1. Validate global `volume` before listening. Reject values outside `0..1`, including `1.5`, and begin from the low-volume baseline of `0.1`. Do not assume the global option is clamped for you.
2. Change one parameter group per pass:
   - **Dynamics:** `volume`, then `debounceMs`.
   - **Character:** `pleasantness`, `brightness`, and `valence`.
   - **Motion:** `arousal`, `simultaneity`, and duration.
   - **Path override:** one `soundMapping` entry only after the base profile is understood.
3. Repeat the exact gesture scenario and record the option delta, automatic state result, and human listening result.
4. Keep a candidate only if it improves the defined goal without changing application state behavior.
5. Use `performanceMode` only as a separately compared throughput setting.

`AestheticParams.duration` is seconds. `soundMapping[path].duration` is milliseconds. See the unit-safe example before editing either value.

## Stop and rollback

Stop when a documented candidate meets the listening goal in the fixed scenario and consumer typecheck, tests, and build still pass. If results conflict, restore the last recorded configuration and repeat one isolated parameter group. Do not claim that automated checks established audible quality.

## References

- [Compatibility and fixed-scenario rules](references/compatibility.md)
- [Typed profiles, mapping precedence, and duration units](references/config-examples.md)
- [Tuning recovery steps](references/troubleshooting.md)
