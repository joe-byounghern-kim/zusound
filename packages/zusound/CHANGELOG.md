# zusound

## 0.2.1

### Patch Changes

- updated docs

## 0.2.0

### Minor Changes

- Add first-class subscriber support with `store.subscribe(zusound)` and `createZusound(options?)`, including lifecycle-safe cleanup via `instance.cleanup()`.

  Improve release and reliability ergonomics by forwarding middleware `onError`, consolidating change emission paths, tightening value-type handling in diffing, and adding coverage-gated CI/release automation.
