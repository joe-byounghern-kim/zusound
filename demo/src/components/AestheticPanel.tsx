import { useState } from 'react'
import { tonePresets, type DemoOptions, type Tone } from '../demoOptions'

export function AestheticPanel({
  options,
  onChange,
}: {
  options: DemoOptions
  onChange: (next: DemoOptions) => void
}) {
  const [preset, setPreset] = useState('Default')
  function choose(name: 'Default' | keyof typeof tonePresets) {
    setPreset(name)
    onChange({ ...options, aesthetics: name === 'Default' ? null : tonePresets[name] })
  }
  function tune(patch: Partial<Tone>) {
    setPreset('Custom')
    onChange({
      ...options,
      aesthetics: { ...(options.aesthetics ?? tonePresets.Custom), ...patch },
    })
  }
  return (
    <details className="tuning">
      <summary>
        Tune the sound <span>Optional</span>
      </summary>
      <p className="muted">
        Default lets each value type keep its own character. Presets override it. Change a value
        above to hear the result.
      </p>
      <div className="preset-row" aria-label="Sound presets">
        {(['Default', 'Soft', 'Bright', 'Custom'] as const).map((name) => (
          <button
            key={name}
            type="button"
            aria-pressed={preset === name}
            onClick={() => choose(name)}
          >
            {name}
          </button>
        ))}
      </div>
      {options.aesthetics && (
        <div className="tone-controls">
          <label>
            Consonance <span className="muted">rough ↔ smooth</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={options.aesthetics.pleasantness}
              onChange={(event) => tune({ pleasantness: Number(event.target.value) })}
            />
            <output>{options.aesthetics.pleasantness.toFixed(2)}</output>
          </label>
          <label>
            Brightness <span className="muted">soft ↔ sharp</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={options.aesthetics.brightness}
              onChange={(event) => tune({ brightness: Number(event.target.value) })}
            />
            <output>{options.aesthetics.brightness.toFixed(2)}</output>
          </label>
          <label>
            Length <span className="muted">milliseconds</span>
            <input
              type="range"
              min="80"
              max="300"
              step="10"
              value={Math.round((options.aesthetics.duration ?? 0.15) * 1000)}
              onChange={(event) => tune({ duration: Number(event.target.value) / 1000 })}
            />
            <output>{Math.round((options.aesthetics.duration ?? 0.15) * 1000)} ms</output>
          </label>
        </div>
      )}
    </details>
  )
}
