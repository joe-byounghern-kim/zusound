import { useEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { ActionLog, type LogEntry } from '../components/ActionLog'
import { AestheticPanel } from '../components/AestheticPanel'
import { CodeBlock } from '../components/CodeBlock'
import { defaultDemoOptions, soundOptions, type DemoOptions } from '../demoOptions'
import { bindSubscriberZusound, getDemoChanges, getDemoData, useSubscriberStore } from '../store'
import subscriberExample from '../examples/subscriber.ts?raw'

export function Demo() {
  const state = useSubscriberStore(useShallow(getDemoData))
  const [enabled, setEnabled] = useState(false)
  const [options, setOptions] = useState<DemoOptions>(defaultDemoOptions)
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [diagnostic, setDiagnostic] = useState('')
  const cleanupSound = useRef<(() => void) | null>(null)
  const burst = useRef<ReturnType<typeof setInterval> | null>(null)
  const nextId = useRef(0)

  useEffect(() => {
    const unsubscribe = useSubscriberStore.subscribe((current, previous) => {
      const changes = getDemoChanges(current, previous)
      if (changes.length) {
        const additions = changes.map((change) => ({ ...change, id: ++nextId.current }))
        setEntries((old) => [...additions.reverse(), ...old].slice(0, 5))
      }
    })
    return () => {
      unsubscribe()
      cleanupSound.current?.()
      if (burst.current !== null) clearInterval(burst.current)
    }
  }, [])

  function stopBurst() {
    if (burst.current !== null) clearInterval(burst.current)
    burst.current = null
    setRunning(false)
  }

  function attach(next: DemoOptions) {
    cleanupSound.current?.()
    cleanupSound.current = bindSubscriberZusound({
      ...soundOptions(next),
      onError: () =>
        setDiagnostic(
          'Sound could not start. Check your browser or output device, then mute and enable sound to retry.'
        ),
    })
  }

  function toggleSound() {
    stopBurst()
    setDiagnostic('')
    if (enabled) {
      cleanupSound.current?.()
      cleanupSound.current = null
      setEnabled(false)
      return
    }
    if (!('AudioContext' in window) && !('webkitAudioContext' in window)) {
      setDiagnostic(
        'Web Audio is not available in this browser. The state examples still work without sound.'
      )
      useSubscriberStore.getState().increment()
      return
    }
    // Attach before the known update, inside the user's click rather than an effect.
    attach(options)
    setEnabled(true)
    useSubscriberStore.getState().increment()
  }

  function configure(next: DemoOptions) {
    stopBurst()
    setOptions(next)
    if (enabled) attach(next)
  }

  function runBurst() {
    if (burst.current !== null) return
    let count = 0
    setProgress(0)
    setRunning(true)
    burst.current = setInterval(() => {
      useSubscriberStore.getState().increment()
      setProgress(++count)
      if (count === 20) stopBurst()
    }, 25)
  }

  function reset() {
    stopBurst()
    cleanupSound.current?.()
    cleanupSound.current = null
    setEnabled(false)
    setDiagnostic('')
    setProgress(0)
    useSubscriberStore.getState().reset()
    setEntries([])
  }

  const code = subscriberExample.replace(
    '{ enabled: true, volume: 0.15, debounceMs: 0 }',
    JSON.stringify(soundOptions(options), null, 2).replaceAll('\n', '\n  ')
  )

  return (
    <>
      <section id="playground" className="playground" aria-label="Interactive state examples">
        <div className="sound-bar">
          <button
            type="button"
            className={enabled ? 'sound-toggle' : 'sound-toggle primary'}
            aria-pressed={enabled}
            onClick={toggleSound}
          >
            <span aria-hidden="true" className={enabled ? 'sound-dot is-on' : 'sound-dot'} />
            {enabled ? 'Mute sound' : 'Enable sound & try +1'}
          </button>
          <label className="volume-control">
            Volume
            <input
              type="range"
              min="0"
              max="0.4"
              step="0.01"
              value={options.volume}
              onChange={(event) => configure({ ...options, volume: Number(event.target.value) })}
            />
            <output>{Math.round(options.volume * 100)}%</output>
          </label>
        </div>
        <p className="sound-status small" role="status">
          {diagnostic ||
            (enabled
              ? 'Sound requested. Each update below can play a cue.'
              : 'Sound is off. The examples still work silently.')}
        </p>
        <div className="examples">
          <article className="example counter-example">
            <div className="example-label">
              <h2>Counter</h2>
              <code>number</code>
            </div>
            <output className="counter-value" aria-label="Counter value" aria-live="off">
              {state.count}
            </output>
            <button type="button" onClick={() => useSubscriberStore.getState().increment()}>
              Try +1
            </button>
            <p className="small muted">
              <code>count</code> increases by one.
            </p>
          </article>
          <article className="example toggle-example">
            <div className="example-label">
              <h2>Toggle</h2>
              <code>boolean</code>
            </div>
            <output className="boolean-value" aria-live="off">
              <span
                className={state.toggled ? 'boolean-light active' : 'boolean-light'}
                aria-hidden="true"
              />
              {String(state.toggled)}
            </output>
            <button type="button" onClick={() => useSubscriberStore.getState().toggle()}>
              Toggle
            </button>
            <p className="small muted">
              <code>toggled</code> switches true / false.
            </p>
          </article>
          <article className="example list-example">
            <div className="example-label">
              <h2>List</h2>
              <code>array</code>
            </div>
            <output className="list-value" aria-live="off">
              {state.items.length} {state.items.length === 1 ? 'item' : 'items'}
            </output>
            <div className="list-buttons">
              <button type="button" onClick={() => useSubscriberStore.getState().addItem()}>
                Add item
              </button>
              <button
                type="button"
                disabled={!state.items.length}
                onClick={() => useSubscriberStore.getState().removeItem()}
              >
                Remove item
              </button>
            </div>
            <p className="small muted">
              <code>items</code> gets a new array.
            </p>
          </article>
        </div>
        <div className="inspection-bar">
          <details>
            <summary>Inspect state</summary>
            <pre data-testid="state" className="state-display">
              {JSON.stringify(state, null, 2)}
            </pre>
          </details>
          <button type="button" className="quiet-button" onClick={reset}>
            Reset
          </button>
        </div>
        <ActionLog entries={entries} running={running} />
      </section>

      <section className="burst-section" aria-labelledby="burst-heading">
        <div>
          <p className="kicker">One option to try</p>
          <h2 id="burst-heading">Hear the difference a pause makes.</h2>
          <p className="muted">
            Run 20 counter updates, 25 ms apart. Choose whether to hear each update or wait until
            the burst stops.
          </p>
        </div>
        <div className="burst-controls">
          <div className="segmented" aria-label="Debounce setting">
            <button
              type="button"
              aria-pressed={options.debounceMs === 0}
              onClick={() => configure({ ...options, debounceMs: 0 })}
            >
              Every update <code>0 ms</code>
            </button>
            <button
              type="button"
              aria-pressed={options.debounceMs === 80}
              onClick={() => configure({ ...options, debounceMs: 80 })}
            >
              After a pause <code>80 ms</code>
            </button>
          </div>
          <div className="burst-actions">
            <button type="button" disabled={running} onClick={runBurst}>
              Run 20 updates
            </button>
            {running && (
              <button type="button" onClick={() => configure(options)}>
                Stop
              </button>
            )}
            <output aria-live="off">{progress} / 20</output>
          </div>
          <p className="small muted">
            {options.debounceMs === 0
              ? 'No debounce: one cue for each update.'
              : '80 ms debounce: the latest count change plays after updates stop.'}{' '}
            {!enabled && 'Enable sound above to hear it.'}
          </p>
        </div>
      </section>

      <AestheticPanel options={options} onChange={configure} />

      <section id="usage" className="usage" aria-labelledby="usage-heading">
        <p className="kicker">Use it in your store</p>
        <h2 id="usage-heading">A subscription. A few options.</h2>
        <div className="install-line">
          <code>npm install zusound zustand</code>
        </div>
        <p className="muted">
          This demo subscribes to an existing Zustand store. The example below uses your current
          volume, debounce, and tone settings.
        </p>
        <CodeBlock code={code} />
        <p className="small muted">
          Prefer middleware?{' '}
          <a href="https://github.com/joe-byounghern-kim/zusound#quick-start">
            Start with the middleware example.
          </a>{' '}
          Production sound is off by default; this example opts in explicitly. Keep visual feedback
          too.
        </p>
      </section>

      <details className="sound-help">
        <summary>No sound?</summary>
        <p>
          Check your output device and volume, then use the enable button or a state-change button
          directly. Browsers may require a click or tap before playing audio. Sound is optional; the
          state and change history do not depend on it.
        </p>
      </details>
    </>
  )
}
