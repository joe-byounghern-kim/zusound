---
'zusound': patch
---

Honor bundler-replaced `process.env.NODE_ENV` when choosing default audio enablement, even in browsers without a `process` global. Preserve safe fallback detection when no replacement is available.
