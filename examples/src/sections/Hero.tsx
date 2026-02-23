const scrollToPlayground = () => {
  document.getElementById('playground')?.scrollIntoView({ behavior: 'smooth' })
}

export function Hero() {
  return (
    <section id="hero" className="hero" aria-label="Introduction">
      <p className="eyebrow">Audio debugging for Zustand</p>
      <h1>Hear State Changes Before Logs Catch Up</h1>
      <p className="hero-sub">
        Zusound turns Zustand updates into instant audio cues — hear adds, removes, and updates
        as distinct tones. Catch infinite loops and race conditions the moment they happen.
      </p>
      <div className="hero-actions">
        <code className="install-cmd">npm install zusound</code>
        <button type="button" className="btn--primary" onClick={scrollToPlayground}>
          Try the Playground
        </button>
        <a
          className="btn btn--ghost"
          href="https://github.com/joe-byounghern-kim/zusound"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </div>
      <ul className="hero-pills" aria-label="Key features">
        <li className="pill">Zero dependencies</li>
        <li className="pill">TypeScript first</li>
        <li className="pill">Auto-disabled in production</li>
        <li className="pill">Works with any Zustand store</li>
      </ul>
    </section>
  )
}
