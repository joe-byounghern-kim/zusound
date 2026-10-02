---
name: zusound-onboarding
description: Use when integrating Zusound into one consumer Zustand store for the first time, including a reversible existing-store pilot with browser-gesture and teardown checks.
compatibility: Zustand >=4.0.0 <6.0.0. Browser Web Audio with explicit lifecycle ownership.
---

# Zusound Onboarding

## Use when

Use for a first Zusound integration, including an application with existing stores
and middleware. Start with one low-risk store, not a broad rollout. Do not
redesign state or infer audible output from mocks.

## Inspect first

1. Read the consumer `package.json` and lockfile. Record its package manager,
   Zustand version, and actual typecheck, test, and build scripts.
2. Capture one browser-facing store's original initializer, middleware order,
   devtools action names, and known action with an immutable top-level update.
   Keep that exact initializer available for rollback and identify its owner.
3. Run baseline typecheck, focused behavior tests, and build before editing.
4. Choose **one** integration mode:
   - Middleware when the store can own `store.zusoundCleanup()` at permanent disposal.
   - Subscriber when audio has a separate attachment owner. This can leave an
     existing initializer and middleware order unchanged.

See [compatibility and lifecycle](references/compatibility.md), the fully typed
[configuration examples](references/config-examples.md), and the
[current API reference](../../../docs/API.md).

## Procedure

1. Install `zusound` alongside the consumer's supported Zustand version with its
   existing package manager.
2. Add one integration with `{ enabled: true, volume: 0.2 }` for the development
   check. Preserve existing state behavior and supported middleware order. For
   exactly Zustand 4.0, use its outermost-Zusound ordering exception.
3. For middleware, retain the typed `StateCreator<State, [], []>` initializer,
   infer `const enhanced = zusound(initializer, options)`, then pass that to
   `create<State>()(enhanced)` or `createStore<State>()(enhanced)`. Do not annotate
   away cleanup metadata or cast around declaration errors.
4. In a browser, click or tap a control that calls the known action. Confirm that
   its visible or stored state result matches the baseline. Then record whether
   a human listener heard optional feedback, separately from automatic evidence.
5. Add teardown at the correct ownership boundary. Middleware calls
   `store.zusoundCleanup()` at permanent store disposal, not every React unmount
   if the store outlives the component. Subscriber teardown calls `unsubscribe()`
   and then `zs.cleanup()`. React effects create a fresh instance for each setup.
6. Run the same application typecheck, relevant tests, and build. Do not substitute
   repository skill scripts. Expand to another store only after the first store's
   state behavior, lifecycle, and rollback instructions are verified.

## Stop and rollback

Stop after one known post-gesture update passes application checks, teardown is
present, and any listening result is recorded separately. If state, types, or
ownership regress, restore the saved initializer and remove its audio cleanup
call. For a subscriber, dispose both handles before removing the attachment.
Rerun baseline commands and record the recovery result. Do not expand while
rollback or teardown is uncertain. Uninstall `zusound` only if no remaining
integration uses it. See [troubleshooting](references/troubleshooting.md) before
escalating a no-audio report.

## Evidence to record

Record the chosen store, before/after middleware order, integration mode,
baseline and final commands/results, browser gesture and visible update, teardown
location, rollback instructions/result, and any listener-provided audio result.
Never describe mocked or automated Web Audio output as observed audio.
