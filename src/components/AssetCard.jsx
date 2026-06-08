import { useRef, useState } from 'react'
import { ModelStage, UploadedModelStage } from './Model3D'
import TextureSwatch from './TextureSwatch'
import { KIND_EMOJI } from '../data'
import { hasWebGL } from '../lib/webgl'

export default function AssetCard({ asset, index, thumb, isFav, isSelected, onToggleFav, onAdd, onOpen }) {
  const { type, name, kind, pattern, palette, poly, res, formats, size, uploaded } = asset
  const [live, setLive] = useState(false)
  const leaveTimer = useRef()
  const canLive = type === 'model' && hasWebGL() && (uploaded ? !!asset.object3d : true)

  const enter = () => {
    clearTimeout(leaveTimer.current)
    if (canLive) setLive(true)
  }
  const leave = () => {
    leaveTimer.current = setTimeout(() => setLive(false), 250)
  }

  const subline =
    type === 'model'
      ? `3D model${poly != null ? ` · ${poly.toLocaleString('en-US')} tris` : ''}`
      : uploaded
      ? `Texture · ${asset.width}×${asset.height}`
      : `Texture · ${res} · tileable`

  const chip =
    type === 'model' ? (
      uploaded ? (
        asset.primaryFormat || '3D'
      ) : (
        <>
          <span className="chip-dot" /> 3D
        </>
      )
    ) : (
      <>▦ {res}</>
    )

  return (
    <article
      className="card"
      style={{ animationDelay: `${Math.min(index, 14) * 45}ms` }}
      onMouseEnter={enter}
      onMouseLeave={leave}
    >
      <div className="preview" onClick={() => onOpen(asset)}>
        {type === 'model' ? (
          <div className="stage">
            <div className={'studio' + (live ? ' faded' : '')}>
              {thumb ? (
                <img className="thumb-img" src={thumb} alt="" draggable={false} />
              ) : (
                <>
                  <span className="studio-emoji">{uploaded ? '◳' : KIND_EMOJI[kind] || '📦'}</span>
                  <span className="studio-floor" />
                </>
              )}
            </div>
            {live && (
              <div className="canvas-wrap">
                {uploaded ? (
                  <UploadedModelStage object={asset.object3d} />
                ) : (
                  <ModelStage kind={kind} palette={palette} />
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="stage tex">
            {uploaded ? (
              asset.imageUrl ? (
                <img src={asset.imageUrl} alt={name} className="swatch up-img" />
              ) : (
                <div className="up-noimg">{asset.primaryFormat}</div>
              )
            ) : (
              <TextureSwatch pattern={pattern} palette={palette} seed={asset.id} className="swatch" />
            )}
            <span className="tex-scan" />
          </div>
        )}

        <span className="type-chip">{chip}</span>

        <button
          className={'fav-btn' + (isFav ? ' active' : '')}
          onClick={(e) => {
            e.stopPropagation()
            onToggleFav(asset.id)
          }}
          aria-label={isFav ? 'Remove bookmark' : 'Bookmark'}
        >
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="M16 28c7-4.73 11-10 11-15a5.5 5.5 0 0 0-11-2 5.5 5.5 0 0 0-11 2c0 5 4 10.27 11 15z" />
          </svg>
        </button>

        {canLive && <span className="rotate-hint">⟲ Hover to inspect</span>}

        <button
          className={'add-btn' + (isSelected ? ' added' : '')}
          onClick={(e) => {
            e.stopPropagation()
            onAdd(asset)
          }}
          title={isSelected ? 'In your selection' : 'Add to selection'}
        >
          {isSelected ? '✓ Selected' : '+ Select'}
        </button>
      </div>

      <div className="card-info" onClick={() => onOpen(asset)}>
        <div className="card-name">{name}</div>
        <div className="card-sub">{subline}</div>
        <div className="card-meta">
          <span className="formats">
            {formats.slice(0, 3).map((f) => (
              <span className="fmt" key={f}>
                {f}
              </span>
            ))}
          </span>
          <span className="card-size">{size}</span>
        </div>
      </div>
    </article>
  )
}
