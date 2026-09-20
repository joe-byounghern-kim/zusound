# Compatibility and ownership

- Zustand support is `>=4.0.0 <6.0.0`.
- Default enablement is on only in recognized development or test environments. Production and unknown environments are off unless `enabled: true` is supplied.
- Middleware teardown is `store.zusoundCleanup()`. Subscriber teardown is `unsubscribe()` followed by `zs.cleanup()` for the exact attached instance.
- Import is SSR-safe, but browser-only attachment and playback checks belong in a client lifecycle boundary.
- Automated tests can prove state actions, callback invocation, and cleanup. They cannot prove a person heard audio.
