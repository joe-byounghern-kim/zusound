---
name: zusound-onboarding
description: Use when integrating Zusound into one consumer Zustand store for the first time, with browser-gesture, teardown, and rollback checks.
compatibility: Zustand >=4.0.0 <6.0.0. Designed for the upcoming Zusound v0.3.0 lifecycle guidance.
---

# Zusound Onboarding

## Use when

Use for a first Zusound integration in an application that already owns a Zustand store. Do not use it to redesign a store or to infer audible output from mocks.

## Inspect first

1. Read the consumer `package.json` and lockfile. Record its package manager, Zustand version, and the scripts it actually offers for typecheck, tests, and build.
2. Find one browser-facing store with a known action that performs an immutable top-level update, such as an `increment()` action.
3. Decide **one** integration mode before editing:
   - Choose middleware when the store can own `store.zusoundCleanup()`.
   - Choose subscriber mode only when audio must be attached separately and its caller can own both teardown calls.

See [compatibility and lifecycle](references/compatibility.md) and choose the matching fully typed example in [configuration examples](references/config-examples.md).

## Procedure

1. Install `zusound` alongside the consumer's supported Zustand version using its package manager.
2. Add the selected one-store integration with `{ enabled: true, volume: 0.2 }` during development.
3. In a browser, click or tap a control that calls the known store action. This is the first-signal check, not an assertion that sound was heard.
4. Confirm automatically that the action changes the expected visible state or store value. Then ask a human tester whether optional audio feedback was audible after the gesture.
5. Add the appropriate teardown where the store or attachment is disposed. Middleware calls `store.zusoundCleanup()`. Subscriber mode calls `unsubscribe()` and then `zs.cleanup()`.
6. Run the consumer application's discovered typecheck, relevant tests, and build. Do not substitute repository Skill scripts for these checks.

## Stop and rollback

Stop when one known post-gesture update passes the application's automatic checks, a human listener has recorded any listening result separately, and teardown is present. If the integration causes a regression, remove the `zusound(...)` wrapper or subscriber attachment, remove its cleanup call, and rerun the same application checks. See [troubleshooting](references/troubleshooting.md) before escalating a no-audio report.

## Evidence to record

Record the chosen store, integration mode, actual commands and results, the browser gesture and visible update, teardown location, and whether listening evidence was observed by a person. Never describe mocked or automated Web Audio output as observed audio.
