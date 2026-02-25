# Demo API Docs Strategy (Phase 15)

## Decision

- Selected approach: static in-page API docs scene inside `demo/index.html`.
- Rejected for now: OpenAPI renderer integration.
- Rationale: the demo is static vanilla HTML/CSS/JS, API surface is library configuration (not HTTP endpoints), and this path delivers fast with no dependency/tooling overhead.

## Canonical Source Map

| Demo docs subsection                              | Canonical source                                                     |
| ------------------------------------------------- | -------------------------------------------------------------------- |
| Usage patterns (middleware/subscriber)            | `packages/zusound/README.md`, `examples/src/sections/ApiDocs.tsx`    |
| `ZusoundOptions` reference                        | `packages/zusound/src/types.ts`, `packages/zusound/README.md`        |
| `AestheticParams` reference                       | `packages/zusound/src/types.ts`, `packages/zusound/README.md`        |
| `Change` payload example                          | `packages/zusound/src/types.ts`, `examples/src/sections/ApiDocs.tsx` |
| Demo mode notes (local SSE vs hosted simulation)  | `demo/README.md`, `demo/server.js`, `demo/app.js`                    |
| Recipes (`mapChangeToAesthetics`, `soundMapping`) | `packages/zusound/README.md`, `examples/src/sections/ApiDocs.tsx`    |

## Drift Policy

- Canonical ownership: `packages/zusound/src/types.ts` and `packages/zusound/README.md` are authoritative for API names, types, and defaults.
- If any conflict exists, canonical sources win and demo docs must be updated in the same PR.
- Any change touching `ZusoundOptions`, `AestheticParams`, `SoundParams`, `Change`, or primary usage examples must include a demo docs sync check.
