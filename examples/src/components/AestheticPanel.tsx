export type DemoOptions = {
  volume: number
  debounceMs: number
  aesthetics: {
    pleasantness: number
    brightness: number
    arousal: number
    valence: number
    simultaneity: number
    baseMidi: number
  }
}

export const defaultDemoOptions: DemoOptions = {
  volume: 0.3,
  debounceMs: 50,
  aesthetics: {
    pleasantness: 0.7,
    brightness: 0.6,
    arousal: 0.6,
    valence: 0.6,
    simultaneity: 1,
    baseMidi: 69,
  },
}

const PRESETS: Record<string, DemoOptions> = {
  Calm: {
    volume: 0.35,
    debounceMs: 80,
    aesthetics: {
      pleasantness: 0.9,
      brightness: 0.45,
      arousal: 0.25,
      valence: 0.75,
      simultaneity: 1,
      baseMidi: 69,
    },
  },
  Balanced: defaultDemoOptions,
  Tense: {
    volume: 0.55,
    debounceMs: 30,
    aesthetics: {
      pleasantness: 0.25,
      brightness: 0.75,
      arousal: 0.85,
      valence: 0.35,
      simultaneity: 0.9,
      baseMidi: 69,
    },
  },
  Chaotic: {
    volume: 0.62,
    debounceMs: 10,
    aesthetics: {
      pleasantness: 0.15,
      brightness: 0.9,
      arousal: 0.95,
      valence: 0.3,
      simultaneity: 0.15,
      baseMidi: 69,
    },
  },
}

interface AestheticPanelProps {
  options: DemoOptions
  onChange: (next: DemoOptions) => void
  disabled: boolean
}

function SliderRow({
  label,
  min,
  max,
  step,
  value,
  onChange,
  disabled,
}: {
  label: string
  min: number
  max: number
  step: number
  value: number
  onChange: (v: number) => void
  disabled: boolean
}) {
  return (
    <label className="slider-row">
      <span className="slider-label">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <output className="slider-val">{value.toFixed(step < 1 ? 2 : 0)}</output>
    </label>
  )
}

export function AestheticPanel({ options, onChange, disabled }: AestheticPanelProps) {
  const { aesthetics } = options

  function set(patch: Partial<DemoOptions>) {
    onChange({ ...options, ...patch })
  }

  function setAesthetic(patch: Partial<DemoOptions['aesthetics']>) {
    onChange({ ...options, aesthetics: { ...options.aesthetics, ...patch } })
  }

  return (
    <div className="card">
      <h3>Aesthetic Controls</h3>

      <div className="preset-row">
        {Object.entries(PRESETS).map(([name, preset]) => (
          <button
            key={name}
            type="button"
            className="btn--ghost"
            disabled={disabled}
            onClick={() => onChange(preset)}
          >
            {name}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SliderRow
          label="Volume"
          min={0}
          max={1}
          step={0.01}
          value={options.volume}
          disabled={disabled}
          onChange={(v) => set({ volume: v })}
        />
        <SliderRow
          label="Debounce (ms)"
          min={0}
          max={300}
          step={10}
          value={options.debounceMs}
          disabled={disabled}
          onChange={(v) => set({ debounceMs: v })}
        />
        <SliderRow
          label="Pleasantness"
          min={0}
          max={1}
          step={0.01}
          value={aesthetics.pleasantness}
          disabled={disabled}
          onChange={(v) => setAesthetic({ pleasantness: v })}
        />
        <SliderRow
          label="Brightness"
          min={0}
          max={1}
          step={0.01}
          value={aesthetics.brightness}
          disabled={disabled}
          onChange={(v) => setAesthetic({ brightness: v })}
        />
        <SliderRow
          label="Arousal"
          min={0}
          max={1}
          step={0.01}
          value={aesthetics.arousal}
          disabled={disabled}
          onChange={(v) => setAesthetic({ arousal: v })}
        />
        <SliderRow
          label="Valence"
          min={0}
          max={1}
          step={0.01}
          value={aesthetics.valence}
          disabled={disabled}
          onChange={(v) => setAesthetic({ valence: v })}
        />
        <SliderRow
          label="Simultaneity"
          min={0}
          max={1}
          step={0.01}
          value={aesthetics.simultaneity}
          disabled={disabled}
          onChange={(v) => setAesthetic({ simultaneity: v })}
        />
      </div>

      {disabled && (
        <p style={{ color: 'var(--ink-soft)', fontSize: '0.82rem', textAlign: 'center' }}>
          Enable audio to tune aesthetics
        </p>
      )}
    </div>
  )
}
