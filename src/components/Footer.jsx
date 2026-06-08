export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="logo-mark sm" aria-hidden="true">
            <svg viewBox="0 0 32 32">
              <path d="M16 2 4 8.5v15L16 30l12-6.5v-15L16 2Z" className="cube-side" />
              <path d="M16 2 4 8.5 16 15l12-6.5L16 2Z" className="cube-top" />
              <path d="M16 15v15l12-6.5v-15L16 15Z" className="cube-right" />
            </svg>
          </span>
          <span><b>Homa</b> Asset Library</span>
          <span className="footer-ver">v0.4 · internal</span>
        </div>
        <nav className="footer-links">
          <a href="#" onClick={(e) => e.preventDefault()}>Guidelines</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Documentation</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Changelog</a>
          <a href="#" onClick={(e) => e.preventDefault()}>#asset-library</a>
        </nav>
      </div>
    </footer>
  )
}
