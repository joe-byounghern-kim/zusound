import { useMemo } from 'react'

interface CodeBlockProps {
  code: string
  language?: string
}

/**
 * Regex-based syntax highlighter for static code snippets.
 * SAFETY: The `code` prop must be a hardcoded string literal, never user input.
 */
function highlight(raw: string): string {
  const escaped = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Single-pass tokenizer to avoid nested span issues
  const tokens: { start: number; end: number; cls: string }[] = []

  // Comments
  for (const m of escaped.matchAll(/(\/\/.*)/g)) {
    tokens.push({ start: m.index!, end: m.index! + m[0].length, cls: 'tok-comment' })
  }

  // Strings (single, double, template)
  for (const m of escaped.matchAll(/('(?:[^'\\]|\\.)*'|`[^`]*`)/g)) {
    if (!tokens.some((t) => m.index! >= t.start && m.index! < t.end)) {
      tokens.push({ start: m.index!, end: m.index! + m[0].length, cls: 'tok-str' })
    }
  }

  // Keywords
  for (const m of escaped.matchAll(
    /\b(import|export|from|const|let|type|interface|return|if|else|true|false|undefined|null|void|async|await|function|new)\b/g,
  )) {
    if (!tokens.some((t) => m.index! >= t.start && m.index! < t.end)) {
      tokens.push({ start: m.index!, end: m.index! + m[0].length, cls: 'tok-kw' })
    }
  }

  // Numbers
  for (const m of escaped.matchAll(/\b(\d+\.?\d*)\b/g)) {
    if (!tokens.some((t) => m.index! >= t.start && m.index! < t.end)) {
      tokens.push({ start: m.index!, end: m.index! + m[0].length, cls: 'tok-num' })
    }
  }

  // Type names (capitalized identifiers)
  for (const m of escaped.matchAll(/\b([A-Z][a-zA-Z0-9]+)\b/g)) {
    if (!tokens.some((t) => m.index! >= t.start && m.index! < t.end)) {
      tokens.push({ start: m.index!, end: m.index! + m[0].length, cls: 'tok-type' })
    }
  }

  // Sort tokens by position and build output
  tokens.sort((a, b) => a.start - b.start)

  let result = ''
  let cursor = 0
  for (const tok of tokens) {
    if (tok.start > cursor) {
      result += escaped.slice(cursor, tok.start)
    }
    result += `<span class="${tok.cls}">${escaped.slice(tok.start, tok.end)}</span>`
    cursor = tok.end
  }
  if (cursor < escaped.length) {
    result += escaped.slice(cursor)
  }

  return result
}

export function CodeBlock({ code, language = 'typescript' }: CodeBlockProps) {
  const highlighted = useMemo(() => highlight(code), [code])

  return (
    <div className="code-block" role="region" aria-label={`${language} code example`}>
      <span className="code-lang">{language}</span>
      <pre>
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  )
}
