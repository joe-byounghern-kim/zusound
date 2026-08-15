# zusound

## 0.2.5

### Patch Changes

- [#70](https://github.com/joe-byounghern-kim/zusound/pull/70) [`dcda2f0`](https://github.com/joe-byounghern-kim/zusound/commit/dcda2f0179b0b75bd49cee5776b1f668bb789c0e) Thanks [@joe-byounghern-kim](https://github.com/joe-byounghern-kim)! - Modernize package export metadata, compatibility validation, and demo and release infrastructure while preserving the public API and supported Zustand range.

## 0.2.4

### Patch Changes

- Automated release from main merge (f6bdf79).

## 0.2.3

### Patch Changes

- Restore direct `store.subscribe(zusound)` compatibility while keeping safer queued playback cleanup behavior.

## 0.2.2

### Patch Changes

- [#61](https://github.com/joe-byounghern-kim/zusound/pull/61) [`241243f`](https://github.com/joe-byounghern-kim/zusound/commit/241243f4f38bedf7b3eb915c445fbe56070daee5) Thanks [@joe-byounghern-kim](https://github.com/joe-byounghern-kim)! - update docs

## 0.2.1

### Patch Changes

- updated docs

## 0.2.0

### Minor Changes

- Add first-class subscriber support with `store.subscribe(zusound)` and `createZusound(options?)`, including lifecycle-safe cleanup via `instance.cleanup()`.

  Improve release and reliability ergonomics by forwarding middleware `onError`, consolidating change emission paths, tightening value-type handling in diffing, and adding coverage-gated CI/release automation.
