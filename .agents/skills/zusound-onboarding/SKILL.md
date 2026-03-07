---
name: zusound-onboarding
description: Onboard a first-time project to Zusound with deterministic setup, validation, and rollback-safe checkpoints.
---

# Zusound Onboarding

## When To Use

- A user says they are integrating Zusound for the first time.
- They need a copy-paste path from install to first audible state-change feedback.

## Inputs Required

- Package manager (`npm`, `pnpm`, or `yarn`).
- Store style (middleware wrapping or subscriber mode).
- Whether setup must be development-only or explicitly production-enabled.

## Procedure

1. Confirm project uses Zustand (`>=4 <6`) and install `zusound`.
2. Choose one integration path:
   - Middleware path: wrap the store initializer with `zusound(...)`.
   - Subscriber path: create store normally, then `store.subscribe(zusound)` or `createZusound(...)` for explicit lifecycle.
3. Add minimal options for predictable behavior: set `enabled`, `volume`, and `debounceMs`.
4. Run a first-signal checkpoint by triggering one known state update.
5. If no sound occurs, apply troubleshooting in order: user gesture unlock, environment toggle, subscription wiring check.
6. Capture final state: confirm first successful feedback path and leave rollback hint.

## Stop Conditions

- Stop when one known state update consistently produces audible feedback.
- Stop when the user has a documented rollback path (remove wrapper/subscriber and uninstall package).

## Verification

- `pnpm skills:validate`
- `pnpm skills:bridge`

## References

- `references/compatibility.md`
- `references/config-examples.md`
- `references/troubleshooting.md`
