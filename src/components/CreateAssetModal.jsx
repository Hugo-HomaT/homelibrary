import { useEffect, useRef, useState } from 'react'
import { UploadedModelViewer, UploadedTextureViewer } from './Model3D'
import ViewerControls from './ViewerControls'
import { categories } from '../data'
import { hasWebGL } from '../lib/webgl'
import {
  groupOf,
  extOf,
  baseName,
  loadImageMeta,
  parseModel,
  classifyRes,
  formatBytes,
} from '../lib/parseAsset'

let _uid = 0
const uid = () => ++_uid

export default function CreateAssetModal({ existingAssets, onClose, onCreate }) {
  const [entries, setEntries] = useState([])
  const [name, setName] = useState('')
  const [nameEdited, setNameEdited] = useState(false)
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [tiles, setTiles] = useState(1)
  const [dragOver, setDragOver] = useState(false)
  const [mode, setMode] = useState('shaded')
  const [autoRotate, setAutoRotate] = useState(true)
  const [texView, setTexView] = useState('flat')
  const [shape, setShape] = useState('sphere')
  const fileRef = useRef(null)
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

  /* ---------- file ingestion + auto-detection ---------- */
  const addFiles = (fileList) => {
    const incoming = [...fileList].map((file) => ({
      id: uid(),
      file,
      ext: extOf(file.name),
      group: groupOf(file),
      status: 'pending',
      width: 0,
      height: 0,
      url: null,
      object3d: null,
      tris: null,
    }))
    if (incoming.length === 0) return
    setEntries((prev) => [...prev, ...incoming])
    if (!nameEdited) setName((n) => n || baseName(incoming[0].file.name))

    incoming.forEach(async (en) => {
      if (en.group === 'image') {
        const m = await loadImageMeta(en.file)
        setEntries((prev) =>
          prev.map((e) => (e.id === en.id ? { ...e, status: 'done', url: m.url, width: m.width, height: m.height } : e))
        )
      } else if (en.group === 'model') {
        const r = await parseModel(en.file)
        setEntries((prev) =>
          prev.map((e) =>
            e.id === en.id ? { ...e, status: r.error ? 'error' : 'done', object3d: r.object3d, tris: r.tris } : e
          )
        )
      } else {
        setEntries((prev) => prev.map((e) => (e.id === en.id ? { ...e, status: 'done' } : e)))
      }
    })
  }

  const removeEntry = (id) => setEntries((prev) => prev.filter((e) => e.id !== id))

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files)
  }

  /* ---------- derived (auto-detected) ---------- */
  const type = entries.some((e) => e.group === 'model')
    ? 'model'
    : entries.some((e) => e.group === 'image')
    ? 'texture'
    : null
  const pending = entries.some((e) => e.status === 'pending')
  const modelEntry = entries.find((e) => e.group === 'model' && e.object3d)
  const imageEntries = entries.filter((e) => e.group === 'image')
  const primaryImage = imageEntries.reduce(
    (best, e) => (e.width * e.height > (best ? best.width * best.height : -1) ? e : best),
    null
  )
  const formats = [...new Set(entries.map((e) => e.ext.toUpperCase()))]
  const totalSize = entries.reduce((s, e) => s + e.file.size, 0)
  const tris = modelEntry?.tris
  const maxDim = primaryImage ? Math.max(primaryImage.width, primaryImage.height) : 0
  const res = classifyRes(maxDim)

  const nameTrim = name.trim()
  const dupName =
    nameTrim.length > 0 && existingAssets.some((a) => a.name.trim().toLowerCase() === nameTrim.toLowerCase())
  const canCreate = !!type && nameTrim.length > 0 && !dupName && entries.length > 0 && !pending

  const submit = () => {
    if (!canCreate) return
    const base = {
      type,
      name: nameTrim,
      description: description.trim(),
      cats: category ? [category] : [],
      formats,
      size: formatBytes(totalSize),
      uploaded: true,
    }
    const asset =
      type === 'model'
        ? {
            ...base,
            poly: tris ?? null,
            object3d: modelEntry?.object3d || null,
            primaryFormat: (entries.find((e) => e.group === 'model')?.ext || '').toUpperCase(),
          }
        : {
            ...base,
            res,
            width: primaryImage?.width || 0,
            height: primaryImage?.height || 0,
            imageUrl: primaryImage?.url || null,
            primaryFormat: (primaryImage?.ext || '').toUpperCase(),
          }
    onCreate(asset)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal upload-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="upload-head">
          <h2>Upload asset</h2>
          <p>Type, format, resolution and tris are detected from your files.</p>
        </div>

        <div className="upload-body">
          {/* Dropzone */}
          <div
            className={'dropzone' + (dragOver ? ' over' : '')}
            onClick={() => fileRef.current?.click()}
            onDrop={onDrop}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
          >
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".glb,.gltf,.obj,.fbx,.png,.jpg,.jpeg,.webp,.tga,.exr,.bmp,image/*"
              hidden
              onChange={(e) => {
                addFiles(e.target.files)
                e.target.value = ''
              }}
            />
            <div className="dz-ic">⬆</div>
            <p>
              <b>Drop files here</b> or click to browse
            </p>
            <span>Models: GLB · GLTF · OBJ · FBX — Textures: PNG · JPG · WEBP · TGA · EXR</span>
          </div>

          {entries.length > 0 && (
            <>
              {/* File list */}
              <div className="file-list">
                {entries.map((e) => (
                  <div className="file-row" key={e.id}>
                    <span className={'file-ic ' + e.group}>
                      {e.group === 'model' ? '◳' : e.group === 'image' ? '🖼' : '📄'}
                    </span>
                    <div className="file-meta">
                      <span className="file-name">{e.file.name}</span>
                      <span className="file-sub">
                        {formatBytes(e.file.size)}
                        {e.status === 'pending' && ' · analyzing…'}
                        {e.group === 'image' && e.status === 'done' && (e.width > 0 ? ` · ${e.width}×${e.height}` : ' · dimensions n/a')}
                        {e.group === 'model' && e.tris != null && ` · ${e.tris.toLocaleString('en-US')} tris`}
                        {e.status === 'error' && ' · could not parse'}
                      </span>
                    </div>
                    <button className="file-x" onClick={() => removeEntry(e.id)} aria-label="Remove file">
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Detected summary */}
              <div className="detected">
                <span className="det-chip">
                  Type <b>{type === 'model' ? '3D model' : 'Texture'}</b>
                </span>
                <span className="det-chip">
                  Format <b>{formats.join(' · ') || '—'}</b>
                </span>
                {type === 'model' ? (
                  <span className="det-chip">
                    Tris <b>{tris != null ? tris.toLocaleString('en-US') : '—'}</b>
                  </span>
                ) : (
                  <span className="det-chip">
                    Resolution <b>{maxDim > 0 ? `${primaryImage.width}×${primaryImage.height} (${res})` : '—'}</b>
                  </span>
                )}
                <span className="det-chip">
                  Size <b>{formatBytes(totalSize)}</b>
                </span>
              </div>

              {/* Live preview — inspect the asset before adding it */}
              <div className="upload-preview">
                {type === 'model' ? (
                  webgl && modelEntry?.object3d ? (
                    <>
                      <UploadedModelViewer object={modelEntry.object3d} mode={mode} autoRotate={autoRotate} />
                      <ViewerControls mode={mode} onMode={setMode} autoRotate={autoRotate} onAutoRotate={() => setAutoRotate((v) => !v)} />
                      <span className="viewer-hint">Drag to rotate · scroll to zoom</span>
                    </>
                  ) : (
                    <div className="preview-empty">
                      <span>◳</span>
                      <p>{pending ? 'Analyzing model…' : 'Preview unavailable for this file'}</p>
                    </div>
                  )
                ) : primaryImage && maxDim > 0 ? (
                  <>
                    {texView === '3d' && webgl ? (
                      <UploadedTextureViewer url={primaryImage.url} shape={shape} />
                    ) : (
                      <div
                        className="tex-flat"
                        style={{ backgroundImage: `url(${primaryImage.url})`, backgroundSize: `${100 / tiles}%` }}
                      />
                    )}
                    <div className="viewer-controls">
                      <button className={'vc-btn' + (texView === 'flat' ? ' on' : '')} onClick={() => setTexView('flat')}>Flat</button>
                      <button className={'vc-btn' + (texView === '3d' ? ' on' : '')} onClick={() => setTexView('3d')}>3D</button>
                    </div>
                    <div className="preview-tools">
                      {texView === '3d'
                        ? [['sphere', 'Sphere'], ['box', 'Cube'], ['cylinder', 'Cylinder']].map(([s, l]) => (
                            <button key={s} className={'pill' + (shape === s ? ' on' : '')} onClick={() => setShape(s)}>
                              {l}
                            </button>
                          ))
                        : [1, 2, 4].map((t) => (
                            <button key={t} className={'pill' + (tiles === t ? ' on' : '')} onClick={() => setTiles(t)}>
                              {t}×{t}
                            </button>
                          ))}
                    </div>
                  </>
                ) : (
                  <div className="preview-empty">
                    <span>🖼</span>
                    <p>{pending ? 'Reading image…' : 'No pixel preview (TGA/EXR)'}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Editable fields */}
          <div className="field">
            <label>Name</label>
            <input
              className={'text-input' + (dupName ? ' error' : '')}
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setNameEdited(true)
              }}
              placeholder="Asset name"
            />
            {dupName && <span className="field-error">⚠ An asset named “{nameTrim}” already exists.</span>}
          </div>

          <div className="field">
            <label>Description</label>
            <textarea
              className="text-input area"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is it, how to use it, where it comes from…"
              rows={3}
            />
          </div>

          <div className="field">
            <label>
              Category <span className="opt">(optional)</span>
            </label>
            <div className="picker cats">
              {categories
                .filter((c) => c.id !== 'all')
                .map((c) => (
                  <button
                    key={c.id}
                    className={'pill' + (category === c.id ? ' on' : '')}
                    onClick={() => setCategory((cur) => (cur === c.id ? '' : c.id))}
                  >
                    {c.icon} {c.label}
                  </button>
                ))}
            </div>
          </div>
        </div>

        <div className="upload-footer">
          <span className="foot-note">
            {pending ? 'Analyzing files…' : entries.length === 0 ? 'Add at least one file' : `${entries.length} file(s) ready`}
          </span>
          <div className="foot-actions">
            <button className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" disabled={!canCreate} onClick={submit}>
              + Add to library
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
