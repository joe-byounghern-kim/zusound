import { CodeBlock } from '../components/CodeBlock'

const MIDDLEWARE_CODE = `import { create } from 'zustand'
import { zusound } from 'zusound'

const useStore = create(
  zusound(
    (set) => ({
      count: 0,
      increment: () => set((s) => ({ count: s.count + 1 })),
    }),
    { volume: 0.3, debounceMs: 50 }
  )
)`

const SUBSCRIBER_CODE = `import { create } from 'zustand'
import { createZusound } from 'zusound'

const useStore = create((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}))

const instance = createZusound({ volume: 0.3 })
const unsub = useStore.subscribe(instance)

// Cleanup
unsub()
instance.cleanup()`

const CHANGE_EXAMPLE = `// Example: incrementing count from 5 to 6
{
  path: 'count',
  operation: 'update',
  valueType: 'number',
  oldValue: 5,
  newValue: 6
}`

const MAP_AESTHETICS_CODE = `zusound(stateCreator, {
  mapChangeToAesthetics: (change) => {
    if (change.operation === 'add')
      return { pleasantness: 0.9, valence: 0.8 }
    if (change.operation === 'remove')
      return { pleasantness: 0.3, arousal: 0.7 }
    if (change.path === 'error')
      return { pleasantness: 0.1, brightness: 0.9 }
    return {}
  }
})`

const SOUND_MAPPING_CODE = `zusound(stateCreator, {
  soundMapping: {
    count: {
      frequency: 440,
      waveform: 'sine',
      duration: 100,
      volume: 0.5,
    },
    error: {
      frequency: 220,
      waveform: 'sawtooth',
      duration: 300,
      volume: 0.7,
    },
  }
})`

const OPTIONS_DATA = [
  {
    name: 'enabled',
    type: 'boolean',
    def: 'true in dev',
    desc: 'Auto-disabled in production based on NODE_ENV',
  },
  { name: 'volume', type: 'number (0\u20131)', def: '0.3', desc: 'Master volume level' },
  {
    name: 'debounceMs',
    type: 'number',
    def: '0',
    desc: 'Coalesce rapid updates into one sound (ms)',
  },
  {
    name: 'aesthetics',
    type: 'Partial<AestheticParams>',
    def: 'per-type',
    desc: 'Static aesthetic overrides',
  },
  {
    name: 'mapChangeToAesthetics',
    type: '(change) => Partial<AestheticParams>',
    def: '\u2014',
    desc: 'Dynamic per-change aesthetic mapping',
  },
  {
    name: 'soundMapping',
    type: 'Record<string, Partial<SoundParams>>',
    def: '\u2014',
    desc: 'Override sound params by state path',
  },
  {
    name: 'performanceMode',
    type: 'boolean',
    def: 'false',
    desc: 'Use static consonance ranking (faster)',
  },
  {
    name: 'onError',
    type: '(error, context) => void',
    def: '\u2014',
    desc: 'Custom error handler',
  },
]

const AESTHETIC_DATA = [
  { name: 'pleasantness', range: '0\u20131', desc: 'Consonance: 0 = harsh tritone, 1 = pure unison' },
  { name: 'brightness', range: '0\u20131', desc: 'Harmonic richness: 0 = sine-like, 1 = sawtooth-like' },
  { name: 'arousal', range: '0\u20131', desc: 'ADSR speed: 0 = slow fade, 1 = percussive snap' },
  { name: 'valence', range: '0\u20131', desc: 'Sustain: 0 = brief, 1 = full sustain' },
  {
    name: 'simultaneity',
    range: '0\u20131',
    desc: 'Dyad spread: 1 = together, 0 = arpeggiated (~80% spread)',
  },
  { name: 'baseMidi', range: 'MIDI note', desc: 'Root pitch (69 = A4 = 440 Hz)' },
]

export function ApiDocs() {
  return (
    <section id="api" className="api-section" aria-label="API Reference">
      <div className="section-header">
        <p className="eyebrow">Documentation</p>
        <h2>API Reference</h2>
        <p>Everything you need to configure Zusound.</p>
      </div>

      {/* Usage Patterns */}
      <div className="api-subsection">
        <h3>Two Ways to Use</h3>
        <p style={{ color: 'var(--ink-soft)', margin: '8px 0 16px', fontSize: '0.9rem' }}>
          <strong>Middleware</strong> wraps your store creator for zero-config setup.{' '}
          <strong>Subscriber</strong> gives you full runtime control over options and lifecycle.
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

      {/* ZusoundOptions Table */}
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

      {/* AestheticParams Table */}
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

      {/* Change Object */}
      <div className="api-subsection">
        <h3>Change Object</h3>
        <p style={{ color: 'var(--ink-soft)', margin: '8px 0 16px', fontSize: '0.9rem' }}>
          Every state change produces a <code style={{
            fontFamily: "'IBM Plex Mono', monospace",
            background: 'rgba(8,10,18,0.7)',
            border: '1px solid #222850',
            borderRadius: 5,
            padding: '2px 6px',
            fontSize: '0.82rem',
          }}>Change</code> descriptor
          with path, operation type, and value metadata.
        </p>
        <CodeBlock code={CHANGE_EXAMPLE} />
      </div>

      {/* Recipes */}
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
      </div>
    </section>
  )
}
