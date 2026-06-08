import { useCallback, useMemo, useRef, useState } from 'react'
import Header from './components/Header'
import CategoryBar from './components/CategoryBar'
import AssetGrid from './components/AssetGrid'
import AssetModal from './components/AssetModal'
import CreateAssetModal from './components/CreateAssetModal'
import SelectionDrawer from './components/SelectionDrawer'
import Toasts from './components/Toasts'
import Footer from './components/Footer'
import { ThumbnailFactory } from './components/Model3D'
import { hasWebGL } from './lib/webgl'
import { assets as initialAssets, categories } from './data'

export default function App() {
  const [assets, setAssets] = useState(initialAssets)
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sort, setSort] = useState('recent')
  const [favView, setFavView] = useState(false)

  const [favorites, setFavorites] = useState(() => new Set())
  const [selection, setSelection] = useState(() => new Set())
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [openAsset, setOpenAsset] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState(null)
  const [toasts, setToasts] = useState([])
  const toastId = useRef(0)

  /* ---------- pre-rendered model thumbnails (id -> dataURL | null) ---------- */
  const [thumbs, setThumbs] = useState(() => new Map())
  const captureThumb = useCallback((id, url) => {
    setThumbs((prev) => {
      const next = new Map(prev)
      next.set(id, url) // null = capture tentée mais échouée → la card garde l'emoji
      return next
    })
  }, [])
  const webglOk = useMemo(() => hasWebGL(), [])

  /* ---------- toasts ---------- */
  const pushToast = (msg, kind = 'info') => {
    const id = ++toastId.current
    setToasts((t) => [...t, { id, msg, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800)
  }
  const dismissToast = (id) => setToasts((t) => t.filter((x) => x.id !== id))

  /* ---------- bookmarks / selection ---------- */
  const toggleFav = (id) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        pushToast('Removed from bookmarks', 'info')
      } else {
        next.add(id)
        pushToast('Bookmarked', 'fav')
      }
      return next
    })
  }

  const toggleSelection = (asset) => {
    setSelection((prev) => {
      const next = new Set(prev)
      if (next.has(asset.id)) {
        next.delete(asset.id)
        pushToast(`“${asset.name}” removed from selection`, 'info')
      } else {
        next.add(asset.id)
        pushToast(`“${asset.name}” added to selection`, 'success')
      }
      return next
    })
  }

  const exportPack = () => {
    pushToast(`Exported a pack of ${selection.size} asset(s) (simulation)`, 'success')
    setDrawerOpen(false)
  }

  const download = (asset, format) => {
    pushToast(`Downloading “${asset.name}” as .${format} (demo)`, 'success')
  }

  /* ---------- asset creation ---------- */
  const createAsset = (data) => {
    const id = assets.reduce((m, a) => Math.max(m, a.id), 0) + 1
    const asset = { id, ...data }
    setAssets((prev) => [asset, ...prev])
    setCreateOpen(false)
    pushToast(`“${asset.name}” added to the library`, 'success')
    setOpenAsset(asset)
  }

  const updateAsset = (id, patch) => {
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))
    setOpenAsset((cur) => (cur && cur.id === id ? { ...cur, ...patch } : cur))
    setEditingAsset(null)
    pushToast(`“${patch.name || 'Asset'}” updated`, 'success')
  }

  const resetFilters = () => {
    setQuery('')
    setActiveCategory('all')
    setTypeFilter('all')
    setFavView(false)
  }

  /* ---------- filtering + sorting ---------- */
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = assets.filter((a) => {
      if (favView && !favorites.has(a.id)) return false
      if (typeFilter !== 'all' && a.type !== typeFilter) return false
      if (activeCategory !== 'all' && !a.cats.includes(activeCategory)) return false
      if (q) {
        const hay = [a.name, a.kind, a.pattern, a.type, ...a.cats].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })

    const by = {
      az: (a, b) => a.name.localeCompare(b.name, 'en'),
      type: (a, b) => (a.type === b.type ? 0 : a.type === 'model' ? -1 : 1),
    }
    return by[sort] ? [...list].sort(by[sort]) : list
  }, [assets, query, favView, favorites, typeFilter, activeCategory, sort])

  // Modèles encore sans thumbnail → file d'attente de la factory (rendu un par un).
  // Inclut les uploads (dès qu'ils ont un object3d). WebGL absent → on n'en génère aucun.
  const thumbJobs = useMemo(
    () =>
      webglOk
        ? assets.filter((a) => a.type === 'model' && !thumbs.has(a.id) && (a.uploaded ? !!a.object3d : true))
        : [],
    [assets, thumbs, webglOk]
  )

  const selectionItems = assets.filter((a) => selection.has(a.id))
  const filtersActive = query || activeCategory !== 'all' || typeFilter !== 'all' || favView
  const catLabel = categories.find((c) => c.id === activeCategory)?.label || 'All'

  return (
    <div className="app">
      <Header
        query={query}
        onQuery={setQuery}
        favCount={favorites.size}
        favView={favView}
        onToggleFavView={() => setFavView((v) => !v)}
        selectionCount={selection.size}
        onOpenSelection={() => setDrawerOpen(true)}
        onNewAsset={() => setCreateOpen(true)}
      />

      <CategoryBar
        active={activeCategory}
        onChange={setActiveCategory}
        typeFilter={typeFilter}
        onTypeFilter={setTypeFilter}
        sort={sort}
        onSort={setSort}
      />

      <main className="main">
        <div className="results-bar">
          <div>
            <h1 className="results-title">
              {favView ? 'Bookmarks' : catLabel}
              <span className="results-count">{visible.length} asset{visible.length > 1 ? 's' : ''}</span>
            </h1>
            <p className="results-sub">3D models &amp; textures ready for your playable prototypes</p>
          </div>
          {filtersActive && (
            <button className="reset-btn" onClick={resetFilters}>Reset filters</button>
          )}
        </div>

        <AssetGrid
          assets={visible}
          favorites={favorites}
          selection={selection}
          thumbs={thumbs}
          onToggleFav={toggleFav}
          onAdd={toggleSelection}
          onOpen={setOpenAsset}
        />
      </main>

      <Footer />

      {openAsset && (
        <AssetModal
          asset={openAsset}
          isFav={favorites.has(openAsset.id)}
          isSelected={selection.has(openAsset.id)}
          onToggleFav={toggleFav}
          onAdd={toggleSelection}
          onDownload={download}
          onEdit={() => {
            setEditingAsset(openAsset)
            setOpenAsset(null)
          }}
          onClose={() => setOpenAsset(null)}
        />
      )}

      {(createOpen || editingAsset) && (
        <CreateAssetModal
          existingAssets={assets}
          editAsset={editingAsset}
          onClose={() => {
            setCreateOpen(false)
            setEditingAsset(null)
          }}
          onSubmit={editingAsset ? (patch) => updateAsset(editingAsset.id, patch) : createAsset}
        />
      )}

      <SelectionDrawer
        open={drawerOpen}
        items={selectionItems}
        onClose={() => setDrawerOpen(false)}
        onRemove={(id) => toggleSelection(assets.find((a) => a.id === id))}
        onClear={() => {
          setSelection(new Set())
          pushToast('Selection cleared', 'info')
        }}
        onExport={exportPack}
      />

      <Toasts toasts={toasts} onDismiss={dismissToast} />

      {/* Génère les thumbnails 3D hors-écran (un seul canvas, en file). Démonté quand fini. */}
      {thumbJobs.length > 0 && <ThumbnailFactory jobs={thumbJobs} onCapture={captureThumb} />}
    </div>
  )
}
