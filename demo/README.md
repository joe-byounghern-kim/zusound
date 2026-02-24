# Zusound Live Demo

A standalone demo for exercising `zusound` in local dev mode and GitHub Pages hosted mode.

## Local dev mode (real SSE)

From the repository root:

```bash
pnpm install
pnpm build
node demo/server.js
```

Open `http://localhost:3000`.

- Mode badge shows `Local SSE`.
- Demo connects to `/events` from `demo/server.js`.

## Hosted/static mode (simulation)

From the repository root:

```bash
pnpm demo:stage
pnpm demo:verify
pnpm demo:preview
```

Open `http://localhost:4173`.

- Mode badge shows `Hosted simulation`.
- No `/events` connection is attempted.
- Deterministic mock events are generated in the client so logs and state updates still move.

## Staging output

`pnpm demo:stage` creates `demo/dist-site` with:

- `index.html`, `app.js`, `style.css`
- `lib/*` (from `packages/zusound/dist`)
- `vendor/zustand/*` (from `node_modules/zustand/esm`)

`pnpm demo:verify` fails fast if required files/dirs/import-map references are missing.

## GitHub Pages deployment

- Deployment is automated by `.github/workflows/deploy-demo.yml`.
- Pushes to `main` that touch demo/package/workflow inputs trigger build, stage, verify, and deploy.
- Manual redeploy is available with `workflow_dispatch`.

## Troubleshooting

- Missing staged assets: run `pnpm build` then `pnpm demo:stage` again.
- JS/CSS import failures under Pages: run `pnpm demo:verify` and confirm import map references are relative (`./lib`, `./vendor`).
- No sound: click `Enable Audio` first; browsers require user gesture before playback.

## Related docs

- Root overview: `../README.md`
- Development workflow: `../DEVELOPMENT.md`
- Runbook and rollback guidance: `../docs/RUNBOOK.md`
