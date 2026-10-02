# ZuSound demo

The React and Vite app deployed to GitHub Pages. It uses a real Zustand store and ZuSound's subscriber API, with sound off until a click. The first sound button also increments the counter.

```bash
pnpm demo:dev
```

Open the printed local URL. Counter, toggle, and list examples work silently too. A finite 20-update burst compares zero debounce with an 80 ms pause. Tone settings are optional, and the copyable example follows the current options.

## Checks

```bash
pnpm demo:typecheck
pnpm -C demo test
pnpm demo:smoke
```

`demo:smoke` builds the actual app, starts an isolated production preview, and drives Chrome. It checks activation, mute, debounce, cancellation, empty lists, copied configuration, keyboard volume, and responsive layouts. Screenshots and observations are saved in a temporary evidence directory. CI and Pages deployment run it too.

Chrome must be installed. Set `CHROME_PATH` for a nonstandard executable, or `DEMO_URL` to exercise an already deployed site instead of the local preview:

```bash
DEMO_URL=https://joe-byounghern-kim.github.io/zusound/ node scripts/demo-smoke.mjs
```

The browser check observes native Web Audio nodes. It does not confirm audible output through a person's speakers or headphones.

Vite emits relative asset paths so `demo/dist` works under the repository's Pages subpath.
