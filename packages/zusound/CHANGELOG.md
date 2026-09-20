# zusound

## 0.3.0

### Minor Changes

- [`d85f014`](https://github.com/joe-byounghern-kim/zusound/commit/d85f014f483b0228a604f626d6d3d82f5e02501e) Thanks [@joe-byounghern-kim](https://github.com/joe-byounghern-kim)! - Improve typed Zustand middleware composition and cleanup, bound debounced change retention, and isolate diagnostic callback failures. Refresh integration documentation and agent Skills with validated examples and explicit lifecycle guidance.

  TypeScript migration: use curried `create<State>()(...)` or `createStore<State>()(...)` when specifying the state type, and infer the return type of `zusound(initializer)` instead of annotating it as `StateCreator<State, [], []>`. The wrapped initializer now carries the output mutator for the existing `zusoundCleanup()` method. Runtime exports, options, defaults, and the Zustand `>=4 <6` peer range are unchanged.

  Zustand 4.0 consumers should follow the documented default-factory imports and outermost-`zusound` composition examples. Its older declaration metadata differs from Zustand 4.5 and 5. The compatibility matrix checks genuine version-specific factories and both package declaration entry points without disabling strict declaration checking.

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
