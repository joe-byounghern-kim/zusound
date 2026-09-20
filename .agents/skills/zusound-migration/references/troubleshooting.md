# Pilot recovery

## Typecheck fails after wrapping the store

Restore the original middleware order and verify that the consumer supports Zustand `>=4.0.0 <6.0.0`. For an earliest Zustand 4 consumer, preserve its default import style. Do not bypass declaration errors with casts or `skipLibCheck`.

## State behavior differs

Compare the saved baseline action with the pilot action. Preserve immutable top-level updates and existing devtools action names. Revert to the baseline initializer if state behavior is not identical.

## Cleanup is unclear

Do not expand the pilot. Middleware must expose and call `store.zusoundCleanup()`. A subscriber pilot needs both its `unsubscribe()` and its particular instance `zs.cleanup()`. One does not replace the other.

## Rollback check

Restore the baseline initializer or execute the subscriber rollback, then rerun the consumer's original typecheck, focused tests, and build. Record the result before trying another store.
