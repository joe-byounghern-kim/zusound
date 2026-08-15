# ZuSound Demo

This private React, TypeScript, and Vite workspace is the integration demo and GitHub Pages site for ZuSound.

## Run locally

```bash
pnpm demo:dev
```

Open `http://localhost:5173` and enable audio through the page's user-gesture control.

## Validate

```bash
pnpm demo:typecheck
pnpm demo:build
```

The demo covers state-change triggers, aesthetic controls, rapid updates, middleware/subscriber guidance, and the public options reference. Vite uses relative asset paths so `demo/dist` can be deployed under the repository's GitHub Pages subpath.
