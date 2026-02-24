# 🔊 zusound

[![npm version](https://img.shields.io/npm/v/zusound)](https://www.npmjs.com/package/zusound)
[![bundle size](https://img.shields.io/bundlephobia/minzip/zusound)](https://bundlephobia.com/package/zusound)
[![CI](https://github.com/joe-byounghern-kim/zusound/actions/workflows/ci.yml/badge.svg)](https://github.com/joe-byounghern-kim/zusound/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Hear your state changes. Debug faster.

`zusound` is a browser-first Zustand middleware that turns state diffs into short, meaningful Web Audio cues.

- Zero runtime dependencies (besides Zustand peer dependency)
- Safe default: disabled in production unless explicitly enabled
- Lightweight diffing and lazy `AudioContext`
- Optional aesthetics mapping for timbre, pleasantness, and timing behavior

<p align="center">
  <a href="https://joe-byounghern-kim.github.io/zusound/">
    <img src="docs/assets/demo-preview.gif" alt="Zusound Signal Lab Demo" width="720" />
  </a>
</p>

> **[Try the interactive Signal Lab →](https://joe-byounghern-kim.github.io/zusound/)**

## Why Zusound

When state bugs are temporal, logs are often too late. Audio feedback makes update patterns obvious in real time:

- Infinite loops become rapid-fire bursts
- Thrashing updates become unstable rhythms
- Healthy flows become predictable motifs

## Install

```bash
npm install zusound
```

Supported Zustand versions: `>=4 <6`.

## 60-Second Quick Start

You can use `zusound` as a middleware:

```typescript
import { create } from 'zustand'
import { zusound } from 'zusound'

const useStore = create(
  zusound(
    (set) => ({
      count: 0,
      inc: () => set((state) => ({ count: state.count + 1 })),
    }),
    {
      enabled: true,
      volume: 0.3,
    }
  )
)
```

**Or simply use it as a subscriber to any existing store**:

```typescript
const useStore = create((set) => ({
  count: 0,
  inc: () => set((state) => ({ count: state.count + 1 })),
}))

// Listen to all changes with default audio settings
useStore.subscribe(zusound)
```

For long-lived apps this is usually enough. If you mount/unmount dynamic listeners, use a configured instance via `createZusound()` and call both the store `unsubscribe()` and `instance.cleanup()` when done.

## Core Capabilities

- `Change detection`: shallow-first with safe stringify fallback
- `Synthesis`: harmonic `PeriodicWave` timbre generation
- `Aesthetic controls`: pleasantness, brightness, arousal, valence, simultaneity
- `Dissonance mapping`: timbre-aware interval ranking with performance fallback
- `Scheduling`: lookahead audio task scheduler for stable onset timing

## Common Options

```typescript
const useStore = create(
  zusound(
    (set) => ({
      count: 0,
      user: null,
      inc: () => set((state) => ({ count: state.count + 1 })),
    }),
    {
      enabled: true,
      volume: 0.3,
      debounceMs: 40,
      performanceMode: false,
      aesthetics: {
        pleasantness: 0.8,
        brightness: 0.7,
        arousal: 0.6,
        valence: 0.6,
        simultaneity: 1,
        baseMidi: 69,
      },
      mapChangeToAesthetics: (change) => ({
        pleasantness: change.operation === 'add' ? 0.9 : 0.5,
      }),
      onError: (error, context) => {
        console.debug('zusound non-fatal error', context.stage, error)
      },
    }
  )
)
```

## Production Behavior

- Audio is disabled by default in production environments.
- If environment detection is ambiguous, audio remains disabled unless explicitly enabled.
- Browser autoplay policies can keep `AudioContext` suspended until user interaction.
- `performanceMode` skips heavier dissonance ranking and uses static consonance ordering.

## Launch Checklist

Before tagging a release:

```bash
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm build
```

Release gate setup (GitHub environment + npm trusted publisher) is documented in `docs/RELEASE_GATES.md`.

## Docs Map

- Quick start: `QUICK_START.md`
- Development workflow: `DEVELOPMENT.md`
- Package API and recipes: `packages/zusound/README.md`
- Contributor workflow: `docs/CONTRIB.md`
- Operations runbook: `docs/RUNBOOK.md`
- Release gates: `docs/RELEASE_GATES.md`
- Security policy: `SECURITY.md`
- Technical requirements baseline: `REQUIREMENTS.MD`

## Demo

- Hosted demo: `https://joe-byounghern-kim.github.io/zusound/`

Run the demo locally:

```bash
pnpm build
node demo/server.js
```

Then open `http://localhost:3000`.

For detailed demo setup, scenes, and architecture notes, see `demo/README.md`.

TypeScript users can also verify framework integration with the React + Vite strict demo:

```bash
pnpm demo:react:typecheck
pnpm demo:react:dev
```

See `examples/README.md` for details.

Pages deploys are automated through `.github/workflows/deploy-demo.yml` on relevant `main` changes or manual workflow dispatch.

## License

MIT © [joe-byounghern-kim](https://github.com/joe-byounghern-kim)
