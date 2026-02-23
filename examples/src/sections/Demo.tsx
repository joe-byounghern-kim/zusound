import { useState, useEffect, useRef, useCallback } from 'react'
import { AudioGate } from '../components/AudioGate'
import { ActionLog, type LogEntry } from '../components/ActionLog'
import { AestheticPanel, defaultDemoOptions, type DemoOptions } from '../components/AestheticPanel'
import { CodeBlock } from '../components/CodeBlock'
import { useSubscriberStore, bindSubscriberZusound, DATA_KEYS } from '../store'

function timeStr(): string {
  const d = new Date()
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, '0'))
    .join(':')
}

const MIDDLEWARE_SNIPPET = `import { create } from 'zustand'
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

const SUBSCRIBER_SNIPPET = `import { create } from 'zustand'
import { createZusound } from 'zusound'

const useStore = create((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}))

const instance = createZusound({ volume: 0.3 })
const unsub = useStore.subscribe(instance)

// Cleanup when done
unsub()
instance.cleanup()`

// Stable reference to store actions (functions are stable across Zustand state updates)
const storeActions = useSubscriberStore.getState()

export function Demo() {
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [mode, setMode] = useState<'middleware' | 'subscriber'>('middleware')
  const [options, setOptions] = useState<DemoOptions>(defaultDemoOptions)
  const [committed, setCommitted] = useState(options)
  const [log, setLog] = useState<LogEntry[]>([])
  const debounceRef = useRef<number | null>(null)
  const burstRef = useRef<number | null>(null)

  // Zusound binding
  useEffect(() => {
    if (!audioEnabled) return
    const cleanup = bindSubscriberZusound({
      ...committed,
      enabled: true,
      aesthetics: committed.aesthetics,
      mapChangeToAesthetics: (change) => {
        if (change.operation === 'add')
          return { pleasantness: 0.88, valence: 0.82 }
        if (change.operation === 'remove')
          return { pleasantness: 0.34, arousal: 0.72 }
        return { pleasantness: 0.64 }
      },
    })
    return cleanup
  }, [audioEnabled, committed])

  // Option debouncing
  function handleOptionChange(next: DemoOptions) {
    setOptions(next)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => setCommitted(next), 200)
  }

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (burstRef.current) clearInterval(burstRef.current)
    }
  }, [])

  // Log subscription (always active)
  useEffect(() => {
    return useSubscriberStore.subscribe((curr, prev) => {
      const entries: LogEntry[] = []
      for (const key of DATA_KEYS) {
        if (!Object.is(curr[key], prev[key])) {
          let op: LogEntry['op'] = 'update'
          if (key === 'items') {
            const currItems = curr.items as string[]
            const prevItems = prev.items as string[]
            op = currItems.length > prevItems.length ? 'add' : 'remove'
          }
          entries.push({
            id: crypto.randomUUID(),
            ts: timeStr(),
            action: `${key} changed`,
            op,
          })
        }
      }
      if (entries.length > 0) {
        setLog((prev) => [...entries, ...prev].slice(0, 30))
      }
    })
  }, [])

  // Rapid burst with overlap guard and cleanup
  const handleBurst = useCallback(() => {
    if (burstRef.current) clearInterval(burstRef.current)
    let i = 0
    burstRef.current = window.setInterval(() => {
      useSubscriberStore.getState().increment()
      if (++i >= 20) {
        clearInterval(burstRef.current!)
        burstRef.current = null
      }
    }, 25)
  }, [])

  // Live state
  const liveState = useSubscriberStore((state) => ({
    count: state.count,
    toggled: state.toggled,
    status: state.status,
    items: state.items,
    user: state.user,
  }))

  return (
    <section id="playground" className="demo-section" aria-labelledby="playground-heading">
      <div className="section-header">
        <p className="eyebrow">Interactive Demo</p>
        <h2 id="playground-heading">Hear Your State Changes</h2>
        <p>Trigger state changes and hear audio feedback in real-time.</p>
      </div>

      <AudioGate enabled={audioEnabled} onEnable={() => setAudioEnabled(true)} />

      <div className="demo-grid">
        <div className="demo-col">
          {/* State Triggers */}
          <div className="card">
            <h3>State Triggers</h3>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.88rem' }}>
              Each data type produces a distinct tone.
            </p>
            <div className="controls-grid">
              <button type="button" className="btn--primary" onClick={() => storeActions.increment()}>
                Increment (+)
              </button>
              <button type="button" onClick={() => storeActions.decrement()}>
                Decrement (-)
              </button>
              <button type="button" onClick={() => storeActions.toggle()}>
                Toggle Bool
              </button>
              <button type="button" onClick={() => storeActions.addItem()}>
                Add Item
              </button>
              <button type="button" className="btn--danger" onClick={() => storeActions.removeItem()}>
                Remove Item
              </button>
              <button type="button" onClick={() => storeActions.cycleStatus()}>
                Cycle Status
              </button>
              <button
                type="button"
                onClick={() => storeActions.updateUser({ active: !liveState.user.active })}
              >
                Toggle User
              </button>
              <button type="button" className="btn--warning" onClick={() => storeActions.reset()}>
                Reset
              </button>
            </div>
          </div>

          {/* Stress Test */}
          <div className="card card--danger">
            <h3>Stress Test</h3>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.88rem' }}>
              Hear what an infinite loop sounds like — 20 rapid updates in 500ms.
            </p>
            <button type="button" className="btn--danger" onClick={handleBurst}>
              Fire Rapid Burst
            </button>
          </div>

          {/* Usage Mode */}
          <div className="card">
            <h3>Usage Patterns</h3>
            <div className="mode-tabs" role="group" aria-label="Usage pattern selection">
              <button
                type="button"
                aria-pressed={mode === 'middleware'}
                onClick={() => setMode('middleware')}
              >
                Middleware
              </button>
              <button
                type="button"
                aria-pressed={mode === 'subscriber'}
                onClick={() => setMode('subscriber')}
              >
                Subscriber
              </button>
            </div>
            <CodeBlock
              code={mode === 'middleware' ? MIDDLEWARE_SNIPPET : SUBSCRIBER_SNIPPET}
            />
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.78rem' }}>
              This playground uses the subscriber pattern so aesthetic sliders update live.
            </p>
          </div>
        </div>

        <div className="demo-col">
          <AestheticPanel
            options={options}
            onChange={handleOptionChange}
            disabled={!audioEnabled}
          />

          {/* Live State */}
          <div className="card">
            <h3>Live State</h3>
            <pre className="state-display">{JSON.stringify(liveState, null, 2)}</pre>
          </div>
        </div>
      </div>

      <ActionLog entries={log} />
    </section>
  )
}
