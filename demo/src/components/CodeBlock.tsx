import { useState } from 'react'

export function CodeBlock({ code, language = 'typescript' }: { code: string; language?: string }) {
  const [status, setStatus] = useState('')
  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setStatus('Copied')
    } catch {
      setStatus('Copy unavailable. Select the code and copy it manually.')
    }
  }
  return (
    <div className="code-block" role="region" aria-label={`${language} code example`}>
      <div className="code-toolbar">
        <span>{language}</span>
        <button type="button" onClick={() => void copy()}>
          Copy code
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
      <span className="copy-status" role="status">
        {status}
      </span>
    </div>
  )
}
