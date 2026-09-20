---
name: zusound-migration
description: Use when migrating an existing Zustand application to Zusound through one typed, cleanup-safe, reversible pilot store.
compatibility: Zustand >=4.0.0 <6.0.0. Designed for the upcoming Zusound v0.3.0 lifecycle guidance.
---

# Zusound Migration

## Use when

Use when a team has existing Zustand stores and needs a low-risk pilot instead of a broad rollout. Keep the pilot store small enough to restore its exact previous initializer if needed.

## Inspect first

1. Capture the chosen store's current initializer, middleware order, known browser action, and application typecheck, test, and build scripts.
2. Pick one low-risk store with an immutable top-level update and a rollback owner.
3. Choose middleware for a permanent store-owned integration, or subscriber mode only where an attachment owner can call both cleanup functions.

See the typed [pilot and rollback examples](references/config-examples.md) and [composition compatibility](references/compatibility.md).

## Pilot procedure

1. Run the consumer's baseline typecheck, focused tests, and build before changing the store.
2. Apply the selected pilot integration with development-only explicit enablement and low volume. Preserve the documented middleware order exactly. Keep any `StateCreator<State, [], []>` initializer annotation, assign `const enhanced = zusound(initializer)`, then pass `enhanced` to `create<State>()` or `createStore<State>()` so cleanup typing is inferred.
3. Confirm that the existing browser action still produces the same visible state and typecheck result. After a direct gesture, collect optional human listening evidence separately.
4. For middleware, verify `store.zusoundCleanup()` is called at the existing store disposal boundary. For subscribers, verify `unsubscribe()` and `zs.cleanup()` are both called at the attachment boundary.
5. Run the same consumer typecheck, tests, and build. Expand only after these results and rollback instructions are recorded.

## Stop and rollback

Stop after one pilot store passes automatic behavior and lifecycle checks. If state behavior, types, or resource ownership regress, restore the saved initializer or remove the subscriber attachment using the exact rollback example, then rerun the baseline commands. Do not continue rollout while rollback is uncertain.

## Evidence to record

Record before and after initializer order, state-action behavior, typecheck output, teardown ownership, browser gesture result, listener-provided audio result if any, and the tested rollback result.
