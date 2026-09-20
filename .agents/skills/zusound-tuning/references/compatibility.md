# Fixed-scenario rules

- Supported Zustand versions are `>=4.0.0 <6.0.0`. Zustand `>=4.5` and 5 use the modern wrapper order and named imports. Zustand 4.0 can require legacy default imports and requires Zusound outermost around `subscribeWithSelector(...)`, `persist(...)`, or `devtools(...)`. Use the [checked 4.0 fixture](../../../../examples/consumer/smoke-v4.cts) before tuning a legacy integration.
- Use a direct browser gesture and one known immutable top-level update. A silent or unavailable browser context is a debugging concern, not a tuning outcome.
- Keep audio optional and retain visual feedback. Begin at a low volume and obtain human listening feedback separately from automated state and lifecycle checks.
- `debounceMs` is milliseconds. It emits on the trailing edge with the last descriptor per changed top-level path, not a net-diff summary.
