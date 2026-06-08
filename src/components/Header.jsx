import { useState } from 'react'

function Logo() {
  return (
    <a className="logo" href="#" onClick={(e) => e.preventDefault()} aria-label="Homa Asset Library">
      <span className="logo-mark" aria-hidden="true">
        <svg viewBox="0 0 32 32">
          <path d="M16 2 4 8.5v15L16 30l12-6.5v-15L16 2Z" className="cube-side" />
          <path d="M16 2 4 8.5 16 15l12-6.5L16 2Z" className="cube-top" />
          <path d="M16 15v15l12-6.5v-15L16 15Z" className="cube-right" />
        </svg>
      </span>
      <span className="logo-word">
        <b>Homa</b> Asset Library
      </span>
    </a>
  )
}

export default function Header({
  query,
  onQuery,
  favCount,
  favView,
  onToggleFavView,
  selectionCount,
  onOpenSelection,
  onNewAsset,
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="header">
      <div className="header-inner">
        <Logo />

        <div className="searchbar">
          <svg className="search-ic" viewBox="0 0 32 32" aria-hidden="true">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              d="M13 24a11 11 0 1 0 0-22 11 11 0 0 0 0 22zm8-3 9 9"
            />
          </svg>
          <input
            className="search-input"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search models, textures, tags…"
            spellCheck={false}
          />
          {query && (
            <button className="search-clear" onClick={() => onQuery('')} aria-label="Clear">
              ×
            </button>
          )}
        </div>

        <nav className="header-right">
          <button className="ghost-link import-link" onClick={onNewAsset}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" d="M8 3v10M3 8h10" />
            </svg>
            New asset
          </button>

          <button
            className={'icon-pill' + (favView ? ' on' : '')}
            onClick={onToggleFavView}
            aria-label="Bookmarks"
            title="Show bookmarks"
          >
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <path d="M16 28c7-4.73 11-10 11-15a5.5 5.5 0 0 0-11-2 5.5 5.5 0 0 0-11 2c0 5 4 10.27 11 15z" />
            </svg>
            {favCount > 0 && <span className="count-badge">{favCount}</span>}
          </button>

          <button className="select-btn" onClick={onOpenSelection}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M2 3h2l1.2 8.5a1 1 0 0 0 1 .9h6a1 1 0 0 0 1-.85L14 6H5M6.5 15a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm6 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
            </svg>
            Selection
            {selectionCount > 0 && <span className="count-badge solid">{selectionCount}</span>}
          </button>

          <div className="user-menu-wrap">
            <button className="user-menu" onClick={() => setMenuOpen((v) => !v)} aria-haspopup="true" aria-expanded={menuOpen}>
              <svg viewBox="0 0 16 16" className="menu-icon" aria-hidden="true">
                <path fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" d="M2 4h12M2 8h12M2 12h12" />
              </svg>
              <span className="avatar" aria-hidden="true">HD</span>
            </button>
            {menuOpen && (
              <div className="dropdown" role="menu">
                <a className="dropdown-item bold" href="#" onClick={(e) => e.preventDefault()}>My profile</a>
                <a className="dropdown-item" href="#" onClick={(e) => e.preventDefault()}>My uploads</a>
                <a className="dropdown-item" href="#" onClick={(e) => e.preventDefault()}>Bookmarks</a>
                <div className="dropdown-sep" />
                <a className="dropdown-item" href="#" onClick={(e) => e.preventDefault()}>Submission guidelines</a>
                <a className="dropdown-item" href="#" onClick={(e) => e.preventDefault()}>Documentation</a>
                <a className="dropdown-item" href="#" onClick={(e) => e.preventDefault()}>Help &amp; #asset-library</a>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
