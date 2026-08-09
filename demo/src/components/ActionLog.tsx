export type LogEntry = {
  id: string
  ts: string
  action: string
  op: 'add' | 'remove' | 'update'
}

interface ActionLogProps {
  entries: LogEntry[]
}

export function ActionLog({ entries }: ActionLogProps) {
  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h3>Action Log</h3>
      <div
        className="log-container"
        role="log"
        aria-label="State change log"
        aria-relevant="additions"
      >
        {entries.length === 0 ? (
          <p className="log-empty">No state changes yet. Trigger an action above.</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="log-entry">
              <span className="timestamp">{entry.ts}</span>
              <span className={`badge badge--${entry.op}`}>{entry.op}</span>
              <span className="log-msg">{entry.action}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
