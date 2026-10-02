# First-integration recovery

## A click changed state but there was no optional audio

1. Confirm the same direct browser click or tap executes the known action and
   visibly changes a top-level state key.
2. Confirm `{ enabled: true }` for the development check and start at low volume.
3. Retry the direct gesture once. Browser activation can suspend audio before interaction.
4. Confirm the selected integration exists and has not already been cleaned up.
5. Continue with the [debugging skill](../../zusound-debugging/SKILL.md) if these
   checks do not isolate the issue.

## Types or state behavior regressed

Compare against the saved initializer and baseline action. Preserve immutable
updates, middleware order, and devtools action names. Check the exact Zustand
version and import style. Keep the enhanced intermediate inferred for cleanup
metadata. Do not hide errors with casts or `skipLibCheck`.

## Cleanup ownership is unclear

Stop at one store. Middleware needs its store's `zusoundCleanup()` at permanent
disposal. Subscriber mode needs both the subscription's `unsubscribe()` and its
specific instance's `cleanup()`. One does not replace the other. Do not clean up
a shared middleware store merely because one consuming component unmounted.

## Roll back safely

Restore the saved middleware initializer and remove its `zusoundCleanup()` call.
For subscriber mode, first call `unsubscribe()` and `zs.cleanup()`, then remove
the attachment. For a React effect, let effect cleanup run and remove its
attachment component/import. The original persisted or devtools store remains
unchanged. Rerun the original typecheck, focused tests, and build and record the
recovery result before expanding. Uninstall `zusound` only when no integration
uses it.
