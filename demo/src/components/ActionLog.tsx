import type { Change } from 'zusound'

export type LogEntry = Change & { id: number }

export function ActionLog({ entries, running }: { entries: LogEntry[]; running: boolean }) {
  return (
    <section className="changes" aria-labelledby="changes-heading">
      <div className="section-title">
        <h2 id="changes-heading">What changed</h2>
        <span>Latest first</span>
      </div>
      {entries.length === 0 ? (
        <p className="muted">Try an example above. Its before and after values will appear here.</p>
      ) : (
        <ol
          className="change-list"
          aria-label="Recent state changes"
          aria-live={running ? 'off' : 'polite'}
        >
          {entries.map((entry) => (
            <li key={entry.id} className="log-entry">
              <code className="change-path">{entry.path}</code>
              <span className="change-values">
                <code>{JSON.stringify(entry.oldValue)}</code>
                <span aria-label="to"> → </span>
                <code>{JSON.stringify(entry.newValue)}</code>
              </span>
              <span className="badge">{entry.operation}</span>
            </li>
          ))}
        </ol>
      )}
      <p className="small muted">
        These keys already exist. Adding an item updates <code>items</code>; it does not add a store
        key.
      </p>
    </section>
  )
}
