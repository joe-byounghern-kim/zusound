import { CodeBlock } from '../components/CodeBlock'

const MIDDLEWARE_CODE = `import { create } from 'zustand'
import type { StateCreator } from 'zustand/vanilla'
import { zusound } from 'zusound'

type CounterState = {
  count: number
  increment: () => void
}

const counterState: StateCreator<CounterState, [], []> = (set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
})

const enhancedCounterState = zusound(counterState, { enabled: true, volume: 0.2, debounceMs: 50 })

export const useCounterStore = create<CounterState>()(enhancedCounterState)

export function disposeCounterStore(): void {
  useCounterStore.zusoundCleanup()
}`

const SUBSCRIBER_CODE = `import { createStore } from 'zustand/vanilla'
import { createZusound } from 'zusound'

type CounterState = {
  count: number
  increment: () => void
}

const store = createStore<CounterState>()((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))

const instance = createZusound({ enabled: true, volume: 0.2 })
const unsubscribe = store.subscribe(instance)

export function disposeSubscriberAttachment(): void {
  unsubscribe()
  instance.cleanup()
}`

const CHANGE_EXAMPLE = `import type { Change } from 'zusound'

export const countChange: Change = {
  path: 'count',
  operation: 'update',
  valueType: 'number',
  oldValue: 5,
  newValue: 6,
}`

const MAP_AESTHETICS_CODE = `import { create } from 'zustand'
import type { StateCreator } from 'zustand/vanilla'
import { zusound } from 'zusound'

type RequestState = {
  status: 'idle' | 'error'
  setStatus: (status: RequestState['status']) => void
}

const requestState: StateCreator<RequestState, [], []> = (set) => ({
  status: 'idle',
  setStatus: (status) => set({ status }),
})

const enhancedRequestState = zusound(requestState, {
  enabled: true,
  mapChangeToAesthetics: (change) =>
    change.newValue === 'error'
      ? { pleasantness: 0.1, brightness: 0.9 }
      : {},
})

export const useRequestStore = create<RequestState>()(enhancedRequestState)`

const SOUND_MAPPING_CODE = `import { create } from 'zustand'
import type { StateCreator } from 'zustand/vanilla'
import { zusound } from 'zusound'

type UploadState = {
  progress: number
  advance: () => void
}

const uploadState: StateCreator<UploadState, [], []> = (set) => ({
  progress: 0,
  advance: () => set((state) => ({ progress: state.progress + 1 })),
})

const enhancedUploadState = zusound(uploadState, {
  enabled: true,
  volume: 0.1,
  aesthetics: { duration: 0.16 },
  soundMapping: {
    progress: { waveform: 'sine', frequency: 440, duration: 100, volume: 0.5 },
  },
})

export const useUploadStore = create<UploadState>()(enhancedUploadState)`

const OPTIONS_DATA = [
  {
    name: 'enabled',
    type: 'boolean',
    def: 'recognized dev/test: true',
    desc: 'Off in production and unknown environments unless explicitly enabled',
  },
  {
    name: 'volume',
    type: 'number (recommended 0–1)',
    def: '0.3',
    desc: 'Master gain multiplier',
  },
  {
    name: 'debounceMs',
    type: 'number',
    def: '0',
    desc: 'Trailing-edge state-change coalescing in milliseconds',
  },
  {
    name: 'aesthetics',
    type: 'Partial<AestheticParams>',
    def: 'per type',
    desc: 'Static aesthetic overrides',
  },
  {
    name: 'mapChangeToAesthetics',
    type: '(change) => Partial<AestheticParams>',
    def: '—',
    desc: 'Dynamic per-change aesthetic override',
  },
  {
    name: 'soundMapping',
    type: 'Record<string, Partial<SoundParams>>',
    def: '—',
    desc: 'Final path-specific override. Mapping duration is milliseconds.',
  },
  {
    name: 'performanceMode',
    type: 'boolean',
    def: 'false',
    desc: 'Use static consonance ranking',
  },
  {
    name: 'onError',
    type: '(error, context) => void',
    def: '—',
    desc: 'Non-fatal diagnostic callback',
  },
]

const AESTHETIC_DATA = [
  { name: 'pleasantness', range: '0–1', desc: 'Consonance selection' },
  { name: 'brightness', range: '0–1', desc: 'Harmonic brightness' },
  { name: 'arousal', range: '0–1', desc: 'Envelope speed' },
  { name: 'valence', range: '0–1', desc: 'Envelope sustain character' },
  { name: 'simultaneity', range: '0–1', desc: '1 together, 0 spread over about 80% duration' },
  { name: 'baseMidi', range: 'MIDI note', desc: 'Root pitch, 69 = A4 = 440 Hz' },
  {
    name: 'duration',
    range: 'seconds',
    desc: 'Aesthetic duration. Sound mapping duration uses milliseconds.',
  },
]

export function ApiDocs() {
  return (
    <section id="api" className="api-section" aria-label="API Reference">
      <div className="section-header">
        <p className="eyebrow">Documentation</p>
        <h2>API Reference</h2>
        <p>Configure optional, browser-first audio feedback for Zustand state changes.</p>
      </div>

      <div className="api-subsection">
        <h3>Two Ways to Use</h3>
        <p style={{ color: 'var(--ink-soft)', margin: '8px 0 16px', fontSize: '0.9rem' }}>
          <strong>Middleware</strong> adds typed store-owned cleanup. <strong>Subscriber</strong>{' '}
          gives an attachment explicit ownership of both unsubscribe and instance cleanup.
        </p>
        <div className="api-grid">
          <div>
            <p style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 8 }}>
              Middleware Pattern
            </p>
            <CodeBlock code={MIDDLEWARE_CODE} />
          </div>
          <div>
            <p style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 8 }}>
              Subscriber Pattern
            </p>
            <CodeBlock code={SUBSCRIBER_CODE} />
          </div>
        </div>
      </div>

      <div className="api-subsection card">
        <h3>ZusoundOptions</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="option-table">
            <thead>
              <tr>
                <th>Option</th>
                <th>Type</th>
                <th>Default</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {OPTIONS_DATA.map((opt) => (
                <tr key={opt.name}>
                  <td>
                    <code>{opt.name}</code>
                  </td>
                  <td>
                    <code>{opt.type}</code>
                  </td>
                  <td>{opt.def}</td>
                  <td>{opt.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="api-subsection card">
        <h3>AestheticParams</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="option-table">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Range</th>
                <th>Perceptual Effect</th>
              </tr>
            </thead>
            <tbody>
              {AESTHETIC_DATA.map((param) => (
                <tr key={param.name}>
                  <td>
                    <code>{param.name}</code>
                  </td>
                  <td>{param.range}</td>
                  <td>{param.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="api-subsection">
        <h3>Change Object</h3>
        <p style={{ color: 'var(--ink-soft)', margin: '8px 0 16px', fontSize: '0.9rem' }}>
          Every state change produces a{' '}
          <code
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              background: 'rgba(8,10,18,0.7)',
              border: '1px solid #222850',
              borderRadius: 5,
              padding: '2px 6px',
              fontSize: '0.82rem',
            }}
          >
            Change
          </code>{' '}
          descriptor with a top-level path, operation, and value metadata.
        </p>
        <CodeBlock code={CHANGE_EXAMPLE} />
        <p style={{ color: 'var(--ink-soft)', margin: '12px 0 0', fontSize: '0.9rem' }}>
          Use immutable updates so a changed top-level reference can be detected. With debounce, the
          trailing edge uses the last descriptor for each path, not a net diff.
        </p>
      </div>

      <div className="api-subsection">
        <h3>Recipes</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 12 }}>
          <div>
            <p style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 8 }}>
              Dynamic Per-Change Aesthetics
            </p>
            <CodeBlock code={MAP_AESTHETICS_CODE} />
          </div>
          <div>
            <p style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 8 }}>
              Per-Path Sound Overrides
            </p>
            <CodeBlock code={SOUND_MAPPING_CODE} />
          </div>
        </div>
        <p style={{ color: 'var(--ink-soft)', margin: '16px 0 0', fontSize: '0.9rem' }}>
          Resolution is defaults, <code>aesthetics</code>, <code>mapChangeToAesthetics</code>, then{' '}
          <code>soundMapping[path]</code>. <code>AestheticParams.duration</code> is seconds, while{' '}
          <code>SoundParams.duration</code> in a mapping is milliseconds. Audio is optional feedback
          and remains subject to browser gesture activation.
        </p>
      </div>
    </section>
  )
}
