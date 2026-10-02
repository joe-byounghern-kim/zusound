import { version } from 'zusound'

export function Footer() {
  return (
    <footer className="site-footer">
      <p>zusound {version} · MIT · Sound is optional.</p>
      <nav aria-label="More resources">
        <a href="https://www.npmjs.com/package/zusound">npm</a>
        <a href="https://github.com/joe-byounghern-kim/zusound/blob/main/README.md#quick-start">
          Quick start
        </a>
        <a href="https://github.com/joe-byounghern-kim/zusound/blob/main/docs/API.md">API</a>
      </nav>
    </footer>
  )
}
