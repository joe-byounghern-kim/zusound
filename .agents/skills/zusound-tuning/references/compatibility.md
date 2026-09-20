# Fixed-scenario rules

- Supported Zustand versions are `>=4.0.0 <6.0.0`. Modern Zustand 4 and 5 use named imports. Zustand 4.0 can require legacy default imports, so preserve the consumer's import style for that version.
- Use a direct browser gesture and one known immutable top-level update. A silent or unavailable browser context is a debugging concern, not a tuning outcome.
- Keep audio optional and retain visual feedback. Begin at a low volume and obtain human listening feedback separately from automated state and lifecycle checks.
- `debounceMs` is milliseconds. It emits on the trailing edge with the last descriptor per changed top-level path, not a net-diff summary.
