---
'zusound': minor
---

Improve typed Zustand middleware composition and cleanup, bound debounced change retention, and isolate diagnostic callback failures. Refresh integration documentation and agent Skills with validated examples and explicit lifecycle guidance.

TypeScript migration: use curried `create<State>()(...)` or `createStore<State>()(...)` when specifying the state type, and infer the return type of `zusound(initializer)` instead of annotating it as `StateCreator<State, [], []>`. The wrapped initializer now carries the output mutator for the existing `zusoundCleanup()` method. Runtime exports, options, defaults, and the Zustand `>=4 <6` peer range are unchanged.
