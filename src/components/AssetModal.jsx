import { useEffect, useState } from 'react'
import { ModelViewer, TextureViewer, UploadedModelViewer, UploadedTextureViewer } from './Model3D'
import ViewerControls from './ViewerControls'
import TextureSwatch from './TextureSwatch'
import { categories, KIND_EMOJI } from '../data'
import { hasWebGL } from '../lib/webgl'

const catLabel = (id) => categories.find((c) => c.id === id)?.label || id

const PBR_MAPS = [
  { label: 'Albedo', tint: null },
  { label: 'Normal', tint: { base: '#8088ff', accent: '#aab0ff' } },
  { label: 'Roughness', tint: { base: '#7d7d85', accent: '#b4b4bc' } },
  { label: 'AO', tint: { base: '#45454d', accent: '#8a8a92' } },
]

export default function AssetModal({ asset, isFav, isSelected, onToggleFav, onAdd, onDownload, onClose }) {
  const isModel = asset.type === 'model'
  const uploaded = !!asset.uploaded
  const [mode, setMode] = useState('shaded')
  const [autoRotate, setAutoRotate] = useState(true)
  const [format, setFormat] = useState(asset.formats[0])
  const [texTab, setTexTab] = useState('3d')
  const [tiles, setTiles] = useState(2)
  const [shape, setShape] = useState('sphere')
  const webgl = hasWebGL()

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const texHasPixels = !uploaded || asset.width > 0
  const metaLine = isModel
    ? `3D model${asset.poly != null ? ` · ${asset.poly.toLocaleString('en-US')} tris` : ''} · ${asset.size}`
    : uploaded
    ? `Texture · ${asset.width}×${asset.height} · ${asset.size}`
    : `Texture · ${asset.res} · tileable · ${asset.size}`

  const description =
    asset.description?.trim() ||
    (isModel
      ? 'Optimized for mobile playables — clean topology, centered pivot and unwrapped UVs. Drop it straight into your Unity, Cocos or PlayCanvas prototypes.'
      : `Tileable texture${uploaded ? '' : ', generated procedurally'} ready to dress your playable's environments and UI.`)

  /* ---------- model visual ---------- */
  const renderModelVisual = () => {
    if (!webgl) return <div className="viewer-fallback"><span>{uploaded ? '◳' : KIND_EMOJI[asset.kind]}</span><p>WebGL is unavailable in this browser</p></div>
    if (uploaded) {
      return asset.object3d ? (
        <UploadedModelViewer object={asset.object3d} mode={mode} autoRotate={autoRotate} />
      ) : (
        <div className="viewer-fallback"><span>◳</span><p>Preview unavailable for this file</p></div>
      )
    }
    return <ModelViewer kind={asset.kind} palette={asset.palette} mode={mode} autoRotate={autoRotate} />
  }

  /* ---------- texture visual ---------- */
  const renderTextureVisual = () => {
    if (texTab === 'tile') {
      if (uploaded) {
        return texHasPixels ? (
          <div className="tile-preview">
            <div
              className="tile-canvas up"
              style={{ backgroundImage: `url(${asset.imageUrl})`, backgroundSize: `${100 / tiles}%` }}
            />
          </div>
        ) : (
          <div className="viewer-fallback"><span>🖼</span><p>No pixel preview (TGA/EXR)</p></div>
        )
      }
      return (
        <div className="tile-preview">
          <TextureSwatch pattern={asset.pattern} palette={asset.palette} seed={asset.id} tiles={tiles} size={460} className="tile-canvas" />
        </div>
      )
    }
    // 3D tab
    if (!webgl) return <div className="viewer-fallback"><span>▦</span><p>WebGL is unavailable</p></div>
    if (uploaded) {
      return texHasPixels ? (
        <UploadedTextureViewer url={asset.imageUrl} shape={shape} />
      ) : (
        <div className="viewer-fallback"><span>🖼</span><p>No pixel preview (TGA/EXR)</p></div>
      )
    }
    return <TextureViewer pattern={asset.pattern} palette={asset.palette} seed={asset.id} shape={shape} />
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {/* ---------- Visual ---------- */}
        <div className="modal-visual">
          {isModel ? (
            <>
              {renderModelVisual()}
              <ViewerControls mode={mode} onMode={setMode} autoRotate={autoRotate} onAutoRotate={() => setAutoRotate((v) => !v)} />
              <span className="viewer-hint">Drag to rotate · scroll to zoom</span>
            </>
          ) : (
            <>
              {renderTextureVisual()}
              <div className="viewer-controls">
                <button className={'vc-btn' + (texTab === '3d' ? ' on' : '')} onClick={() => setTexTab('3d')}>3D preview</button>
                <button className={'vc-btn' + (texTab === 'tile' ? ' on' : '')} onClick={() => setTexTab('tile')}>Tiling</button>
              </div>
              {texHasPixels && (
                texTab === '3d' ? (
                  <div className="shape-row">
                    {[
                      ['sphere', 'Sphere'],
                      ['box', 'Cube'],
                      ['cylinder', 'Cylinder'],
                    ].map(([s, l]) => (
                      <button key={s} className={'pill' + (shape === s ? ' on' : '')} onClick={() => setShape(s)}>{l}</button>
                    ))}
                  </div>
                ) : (
                  <div className="shape-row">
                    {[1, 2, 4].map((t) => (
                      <button key={t} className={'pill' + (tiles === t ? ' on' : '')} onClick={() => setTiles(t)}>{t}×{t}</button>
                    ))}
                  </div>
                )
              )}
            </>
          )}
        </div>

        {/* ---------- Info ---------- */}
        <div className="modal-info">
          <div className="mi-head">
            <div>
              <div className="mi-tags">
                {asset.cats.map((c) => (
                  <span className="mi-tag" key={c}>{catLabel(c)}</span>
                ))}
                {uploaded && <span className="mi-tag upl">Uploaded</span>}
              </div>
              <h2>{asset.name}</h2>
              <div className="mi-meta">{metaLine}</div>
            </div>
            <button className={'fav-btn big' + (isFav ? ' active' : '')} onClick={() => onToggleFav(asset.id)} aria-label="Bookmark">
              <svg viewBox="0 0 32 32" aria-hidden="true">
                <path d="M16 28c7-4.73 11-10 11-15a5.5 5.5 0 0 0-11-2 5.5 5.5 0 0 0-11 2c0 5 4 10.27 11 15z" />
              </svg>
            </button>
          </div>

          <p className="mi-desc">{description}</p>

          {isModel ? (
            <div className="specs">
              <div><span>Polygons</span><b>{asset.poly != null ? `${asset.poly.toLocaleString('en-US')} tris` : '—'}</b></div>
              <div><span>{uploaded ? 'Files' : 'Pivot'}</span><b>{uploaded ? asset.formats.join(' · ') : 'Centered'}</b></div>
              <div><span>File size</span><b>{asset.size}</b></div>
              <div><span>Status</span><b>Production-ready</b></div>
            </div>
          ) : (
            <>
              {!uploaded && (
                <div className="maps-row">
                  {PBR_MAPS.map((m) => (
                    <div className="map-cell" key={m.label}>
                      <TextureSwatch pattern={asset.pattern} palette={m.tint || asset.palette} seed={asset.id} size={88} className="map-canvas" />
                      <span>{m.label}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="specs">
                <div><span>Resolution</span><b>{uploaded ? (asset.width > 0 ? `${asset.width}×${asset.height}` : '—') : asset.res}</b></div>
                <div><span>{uploaded ? 'Format' : 'Tileable'}</span><b>{uploaded ? asset.formats.join(' · ') : 'Yes'}</b></div>
                <div><span>File size</span><b>{asset.size}</b></div>
                <div><span>Status</span><b>Production-ready</b></div>
              </div>
            </>
          )}

          <div className="format-row">
            <span className="format-label">Format</span>
            <div className="format-pills">
              {asset.formats.map((f) => (
                <button key={f} className={'pill' + (format === f ? ' on' : '')} onClick={() => setFormat(f)}>{f}</button>
              ))}
            </div>
          </div>

          <div className="mi-actions">
            <button className="btn-primary" onClick={() => onDownload(asset, format)}>
              ↓ Download .{format}
            </button>
            <button className={'btn-ghost' + (isSelected ? ' added' : '')} onClick={() => onAdd(asset)}>
              {isSelected ? '✓ In selection' : '+ Select'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
