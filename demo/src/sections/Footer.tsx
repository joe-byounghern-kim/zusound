const LINKS = [
  { label: 'GitHub', href: 'https://github.com/joe-byounghern-kim/zusound' },
  { label: 'npm', href: 'https://www.npmjs.com/package/zusound' },
  {
    label: 'Quick Start',
    href: 'https://github.com/joe-byounghern-kim/zusound/blob/main/QUICK_START.md',
  },
  {
    label: 'Full Docs',
    href: 'https://github.com/joe-byounghern-kim/zusound/blob/main/packages/zusound/README.md',
  },
]

export function Footer() {
  return (
    <footer className="site-footer" aria-label="Site footer">
      <p className="footer-brand">Zusound</p>
      <nav className="footer-links" aria-label="External resources">
        {LINKS.map((link) => (
          <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer">
            {link.label}
          </a>
        ))}
      </nav>
      <p className="footer-note">Zero dependencies. Auto-disabled in production.</p>
    </footer>
  )
}
