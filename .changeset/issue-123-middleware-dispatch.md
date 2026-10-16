---
'zusound': patch
---

Keep function-first calls in middleware mode even when options contain unknown keys, preventing accidental subscriber audio engine retention. Warn about unknown base and per-call option keys in development without warning in production or changing ordinary object-state subscriber behavior.
