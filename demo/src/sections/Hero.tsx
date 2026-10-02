export function Hero() {
  return (
    <>
      <header className="site-header">
        <a className="wordmark" href="#">
          zusound<span aria-hidden="true"> / </span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#usage">Use it</a>
          <a href="https://github.com/joe-byounghern-kim/zusound/blob/main/docs/API.md">
            Reference
          </a>
          <a href="https://github.com/joe-byounghern-kim/zusound">GitHub ↗</a>
        </nav>
      </header>
      <section className="intro" aria-labelledby="page-heading">
        <p className="kicker">Audio feedback for Zustand</p>
        <h1 id="page-heading">Hear your Zustand state.</h1>
        <p>Change a value. Hear a short cue. Keep your eyes on your code.</p>
      </section>
    </>
  )
}
