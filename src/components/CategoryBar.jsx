import { useRef, useState } from 'react'
import { categories } from '../data'

const SORTS = [
  { id: 'recent', label: 'Recently added' },
  { id: 'az', label: 'Name (A–Z)' },
  { id: 'type', label: 'By type' },
]

export default function CategoryBar({ active, onChange, typeFilter, onTypeFilter, sort, onSort }) {
  const scrollerRef = useRef(null)
  const [sortOpen, setSortOpen] = useState(false)

  const scrollBy = (dir) => {
    scrollerRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' })
  }

  return (
    <div className="catbar">
      <div className="catbar-inner">
        <button className="cat-arrow" onClick={() => scrollBy(-1)} aria-label="Précédent">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" d="M10 2 4 8l6 6" />
          </svg>
        </button>

        <div className="cat-scroller" ref={scrollerRef}>
          {categories.map((c) => (
            <button
              key={c.id}
              className={'cat-item' + (active === c.id ? ' active' : '')}
              onClick={() => onChange(c.id)}
            >
              <span className="cat-icon">{c.icon}</span>
              <span className="cat-label">{c.label}</span>
            </button>
          ))}
        </div>

        <button className="cat-arrow" onClick={() => scrollBy(1)} aria-label="Suivant">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" d="M6 2l6 6-6 6" />
          </svg>
        </button>

        <div className="catbar-actions">
          <div className="seg">
            {[
              { id: 'all', label: 'All' },
              { id: 'model', label: '3D' },
              { id: 'texture', label: 'Textures' },
            ].map((t) => (
              <button
                key={t.id}
                className={'seg-btn' + (typeFilter === t.id ? ' active' : '')}
                onClick={() => onTypeFilter(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="sort-wrap">
            <button className="sort-btn" onClick={() => setSortOpen((v) => !v)}>
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" d="M3 4h10M4.5 8h7M6.5 12h3" />
              </svg>
              {SORTS.find((s) => s.id === sort)?.label}
            </button>
            {sortOpen && (
              <>
                <div className="sort-overlay" onClick={() => setSortOpen(false)} />
                <div className="sort-menu">
                  {SORTS.map((s) => (
                    <button
                      key={s.id}
                      className={'sort-item' + (sort === s.id ? ' active' : '')}
                      onClick={() => {
                        onSort(s.id)
                        setSortOpen(false)
                      }}
                    >
                      {s.label}
                      {sort === s.id && <span className="check">✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
