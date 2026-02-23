interface AudioGateProps {
  enabled: boolean
  onEnable: () => void
}

export function AudioGate({ enabled, onEnable }: AudioGateProps) {
  if (enabled) return null

  return (
    <div className="card audio-gate" role="alert">
      <div>
        <p style={{ fontWeight: 700, fontSize: '1.05rem' }}>Enable Audio</p>
        <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem' }}>
          Browsers block audio until a user gesture. Click to unlock sound feedback.
        </p>
      </div>
      <div className="audio-gate-controls">
        <button type="button" className="btn--primary" onClick={onEnable}>
          Enable Audio
        </button>
        <span className="status-pill" aria-live="polite">Audio locked</span>
      </div>
    </div>
  )
}
