---
name: zusound-debugging
description: Use when Zusound feedback is missing, excessive, delayed, or incorrectly mapped and needs browser-gesture and lifecycle diagnosis.
compatibility: Zustand >=4.0.0 <6.0.0. Designed for the upcoming Zusound v0.3.0 lifecycle guidance.
---

# Zusound Debugging

## Use when

Use when optional audio feedback is missing, delayed, too frequent, or has an unexpected character. Start with a reproducible browser action rather than broad logging or arbitrary tuning.

## Gather

- The exact store action and expected top-level key change.
- Middleware or subscriber integration mode, options, and teardown location.
- Browser, environment, whether a direct gesture occurred, and the consumer application's actual typecheck, test, and build commands.

## Procedure

1. Reproduce with one click or tap that executes the known action and confirm the visible or stored state update first.
2. Follow the symptom branch in [troubleshooting](references/troubleshooting.md), in order: environment, browser activation, wiring and lifecycle, detected change, throughput, then mapping.
3. Change only one option or integration fact per attempt. Re-run the same gesture and store action after every change.
4. Use [configuration examples](references/config-examples.md) only to make a minimal diagnostic configuration. Keep app options and telemetry free of secrets.
5. Once automatic behavior is correct, record human listening feedback separately. A passing test, mock, or `onError` callback does not prove audible playback.
6. Run the consumer's actual typecheck, focused tests, and build after the fix.

## Stop and rollback

Stop when the expected top-level change, selected branch result, lifecycle state, and application checks are documented. Roll back the last configuration or wiring change if it makes the trigger worse. Remove the audio wrapper or subscriber attachment if diagnosis must be deferred.

## References

- [Compatibility and ownership](references/compatibility.md)
- [Minimal diagnostic configurations](references/config-examples.md)
- [Symptom branches](references/troubleshooting.md)
