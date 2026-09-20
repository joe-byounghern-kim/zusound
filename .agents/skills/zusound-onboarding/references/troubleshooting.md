# First-integration recovery

## A click changed state but there was no optional audio

1. Confirm the same browser click or tap executes the known action and visibly changes state.
2. Confirm `{ enabled: true }` is present for the development check.
3. Repeat the direct gesture once. Browser activation can suspend audio before interaction.
4. Confirm the selected integration still exists and has not already been cleaned up.
5. Continue with the [debugging Skill](../../zusound-debugging/SKILL.md) if these checks do not isolate the issue.

## Roll back safely

For middleware, remove `zusound(...)` and its `zusoundCleanup()` call. For subscriber mode, call `unsubscribe()` and `zs.cleanup()`, then remove the attachment. Re-run the consumer application's typecheck, relevant tests, and build. If no remaining store uses Zusound, uninstall `zusound` with the same package manager that installed it.
