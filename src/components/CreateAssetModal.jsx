import { useEffect, useRef, useState } from 'react'
import { ModelViewer, TextureViewer, UploadedModelViewer, UploadedTextureViewer } from './Model3D'
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
  detectMapRole,
  MAP_ROLES,
} from '../lib/parseAsset'

let _uid = 0
const uid = () => ++_uid

// Même modale pour créer un asset OU en éditer un existant (prop `editAsset`).
// Un modèle 3D peut porter un "texture set" : des images attachées, chacune avec
// un rôle PBR auto-détecté (albedo, normal, roughness…). En édition on dépose des
// images pour enrichir ce set ; en création on dépose modèle + textures ensemble.
export default function CreateAssetModal({ existingAssets, editAsset = null, onClose, onSubmit }) {
  const isEdit = !!editAsset

  // Maps déjà attachées (édition d'un modèle) → pré-chargées comme entrées "image" finies.
  const seedEntries = () =>
    isEdit && editAsset.type === 'model'
      ? (editAsset.textures || []).map((t) => ({
          id: uid(),
          existing: true,
          file: null,
          name: t.name,
          ext: (t.ext || '').toLowerCase(),
          group: 'image',
          status: 'done',
          role: t.role || 'other',
          url: t.url || null,
          width: t.width || 0,
          height: t.height || 0,
          sizeBytes: t.sizeBytes || 0,
          object3d: null,
          tris: null,
        }))
      : []

  const [entries, setEntries] = useState(seedEntries)
  const [name, setName] = useState(isEdit ? editAsset.name : '')
  const [nameEdited, setNameEdited] = useState(isEdit)
  const [description, setDescription] = useState(isEdit ? editAsset.description || '' : '')
  const [category, setCategory] = useState(isEdit ? editAsset.cats?.[0] || '' : '')
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

  // Type : fixé en édition ; auto-détecté en création.
  const type = isEdit
    ? editAsset.type
    : entries.some((e) => e.group === 'model')
    ? 'model'
    : entries.some((e) => e.group === 'image')
    ? 'texture'
    : null

  // En édition d'un modèle, le dropzone n'accepte que des images (= des maps).
  const imagesOnly = isEdit && editAsset.type === 'model'
  const noDropzone = isEdit && editAsset.type === 'texture'

  /* ---------- file ingestion + auto-detection ---------- */
  const addFiles = (fileList) => {
    let incoming = [...fileList].map((file) => ({
      id: uid(),
      file,
      name: file.name,
      ext: extOf(file.name),
      group: groupOf(file),
      status: 'pending',
      role: groupOf(file) === 'image' ? detectMapRole(file.name) : null,
      width: 0,
      height: 0,
      sizeBytes: file.size,
      url: null,
      object3d: null,
      tris: null,
    }))
    if (imagesOnly) incoming = incoming.filter((e) => e.group === 'image')
    if (noDropzone) incoming = []
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
  const setRole = (id, role) => setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, role } : e)))

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files)
  }

  /* ---------- derived (auto-detected) ---------- */
  const pending = entries.some((e) => e.status === 'pending')
  const modelEntries = entries.filter((e) => e.group === 'model')
  const otherEntries = entries.filter((e) => e.group === 'other')
  const imageEntries = entries.filter((e) => e.group === 'image')
  const modelEntry = isEdit ? null : modelEntries.find((e) => e.object3d) || modelEntries[0]

  // Quand l'asset est un modèle, les images sont des maps attachées (texture set).
  const maps = type === 'model' ? imageEntries : []
  const mapsBytes = maps.reduce((s, e) => s + (e.sizeBytes || 0), 0)

  // Texture (asset image) : on garde la plus grande comme image principale.
  const primaryImage =
    type === 'texture'
      ? imageEntries.reduce((best, e) => (e.width * e.height > (best ? best.width * best.height : -1) ? e : best), null)
      : null

  // Formats : modèle → extensions des fichiers modèle ; texture → extensions des images.
  const modelFormats = [...new Set(modelEntries.map((e) => e.ext.toUpperCase()))]
  const imageFormats = [...new Set(imageEntries.map((e) => e.ext.toUpperCase()))]
  const formats = isEdit ? editAsset.formats : type === 'model' ? modelFormats : imageFormats

  const tris = isEdit ? editAsset.poly : modelEntry?.tris
  const maxDim = primaryImage ? Math.max(primaryImage.width, primaryImage.height) : 0
  const res = classifyRes(maxDim)

  // Taille totale. Création : somme des fichiers. Édition d'un modèle : base + maps (si connue).
  const newFilesBytes = entries.reduce((s, e) => s + (e.sizeBytes || 0), 0)
  let totalSize = isEdit ? null : newFilesBytes
  if (isEdit && type === 'model' && editAsset.sizeBytes != null) {
    const oldMaps = (editAsset.textures || []).reduce((s, t) => s + (t.sizeBytes || 0), 0)
    const baseBytes = Math.max(editAsset.sizeBytes - oldMaps, 0)
    totalSize = baseBytes + mapsBytes
  }

  const nameTrim = name.trim()
  const dupName =
    nameTrim.length > 0 &&
    existingAssets.some((a) => a.id !== editAsset?.id && a.name.trim().toLowerCase() === nameTrim.toLowerCase())

  const canSubmit = isEdit
    ? nameTrim.length > 0 && !dupName && !pending
    : !!type && nameTrim.length > 0 && !dupName && entries.length > 0 && !pending

  const buildMaps = () =>
    maps.map((e) => ({
      id: e.id,
      role: e.role || 'other',
      name: e.name || e.file?.name || 'map',
      ext: (e.ext || '').toUpperCase(),
      url: e.url || null,
      width: e.width || 0,
      height: e.height || 0,
      sizeBytes: e.sizeBytes || 0,
    }))

  const submit = () => {
    if (!canSubmit) return

    if (isEdit) {
      const patch = { name: nameTrim, description: description.trim(), cats: category ? [category] : [] }
      if (type === 'model') {
        patch.textures = buildMaps()
        if (totalSize != null) patch.size = formatBytes(totalSize)
      }
      onSubmit(patch)
      return
    }

    const base = {
      type,
      name: nameTrim,
      description: description.trim(),
      cats: category ? [category] : [],
      formats,
      size: formatBytes(totalSize),
      sizeBytes: totalSize,
      uploaded: true,
    }
    const asset =
      type === 'model'
        ? {
            ...base,
            poly: tris ?? null,
            object3d: modelEntry?.object3d || null,
            primaryFormat: (modelEntry?.ext || '').toUpperCase(),
            textures: buildMaps(),
          }
        : {
            ...base,
            res,
            width: primaryImage?.width || 0,
            height: primaryImage?.height || 0,
            imageUrl: primaryImage?.url || null,
            primaryFormat: (primaryImage?.ext || '').toUpperCase(),
          }
    onSubmit(asset)
  }

  /* ---------- preview ---------- */
  const renderModelControls = () => (
    <>
      <ViewerControls mode={mode} onMode={setMode} autoRotate={autoRotate} onAutoRotate={() => setAutoRotate((v) => !v)} />
      <span className="viewer-hint">Drag to rotate · scroll to zoom</span>
    </>
  )

  const renderEditPreview = () => {
    if (type === 'model') {
      if (webgl && editAsset.uploaded && editAsset.object3d) {
        return (
          <>
            <UploadedModelViewer object={editAsset.object3d} mode={mode} autoRotate={autoRotate} />
            {renderModelControls()}
          </>
        )
      }
      if (webgl && !editAsset.uploaded) {
        return (
          <>
            <ModelViewer kind={editAsset.kind} palette={editAsset.palette} mode={mode} autoRotate={autoRotate} />
            {renderModelControls()}
          </>
        )
      }
      return (
        <div className="preview-empty">
          <span>◳</span>
          <p>{webgl ? 'Preview unavailable for this file' : 'WebGL is unavailable'}</p>
        </div>
      )
    }
    // texture
    if (!editAsset.uploaded) {
      return webgl ? (
        <TextureViewer pattern={editAsset.pattern} palette={editAsset.palette} seed={editAsset.id} shape="sphere" />
      ) : (
        <div className="preview-empty"><span>▦</span><p>WebGL is unavailable</p></div>
      )
    }
    return editAsset.imageUrl ? (
      <div className="tex-flat" style={{ backgroundImage: `url(${editAsset.imageUrl})`, backgroundSize: '50%' }} />
    ) : (
      <div className="preview-empty"><span>🖼</span><p>No pixel preview (TGA/EXR)</p></div>
    )
  }

  const renderCreatePreview = () => {
    if (type === 'model') {
      return webgl && modelEntry?.object3d ? (
        <>
          <UploadedModelViewer object={modelEntry.object3d} mode={mode} autoRotate={autoRotate} />
          {renderModelControls()}
        </>
      ) : (
        <div className="preview-empty">
          <span>◳</span>
          <p>{pending ? 'Analyzing model…' : 'Preview unavailable for this file'}</p>
        </div>
      )
    }
    if (primaryImage && maxDim > 0) {
      return (
        <>
          {texView === '3d' && webgl ? (
            <UploadedTextureViewer url={primaryImage.url} shape={shape} />
          ) : (
            <div className="tex-flat" style={{ backgroundImage: `url(${primaryImage.url})`, backgroundSize: `${100 / tiles}%` }} />
          )}
          <div className="viewer-controls">
            <button className={'vc-btn' + (texView === 'flat' ? ' on' : '')} onClick={() => setTexView('flat')}>Flat</button>
            <button className={'vc-btn' + (texView === '3d' ? ' on' : '')} onClick={() => setTexView('3d')}>3D</button>
          </div>
          <div className="preview-tools">
            {texView === '3d'
              ? [['sphere', 'Sphere'], ['box', 'Cube'], ['cylinder', 'Cylinder']].map(([s, l]) => (
                  <button key={s} className={'pill' + (shape === s ? ' on' : '')} onClick={() => setShape(s)}>{l}</button>
                ))
              : [1, 2, 4].map((t) => (
                  <button key={t} className={'pill' + (tiles === t ? ' on' : '')} onClick={() => setTiles(t)}>{t}×{t}</button>
                ))}
          </div>
        </>
      )
    }
    return (
      <div className="preview-empty">
        <span>🖼</span>
        <p>{pending ? 'Reading image…' : 'No pixel preview (TGA/EXR)'}</p>
      </div>
    )
  }

  const fileListEntries = type === 'model' ? [...modelEntries, ...otherEntries] : entries
  const showBlock = isEdit || entries.length > 0

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal upload-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="upload-head">
          <h2>{isEdit ? 'Edit asset' : 'Upload asset'}</h2>
          <p>
            {isEdit
              ? editAsset.type === 'model'
                ? 'Update details and manage the texture maps attached to this model.'
                : 'Update name, description and category.'
              : 'Type, format, resolution and tris are detected from your files.'}
          </p>
        </div>

        <div className="upload-body">
          {/* Dropzone */}
          {!noDropzone && (
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
                accept={imagesOnly ? '.png,.jpg,.jpeg,.webp,.tga,.exr,.bmp,image/*' : '.glb,.gltf,.obj,.fbx,.png,.jpg,.jpeg,.webp,.tga,.exr,.bmp,image/*'}
                hidden
                onChange={(e) => {
                  addFiles(e.target.files)
                  e.target.value = ''
                }}
              />
              <div className="dz-ic">⬆</div>
              <p>
                <b>{imagesOnly ? 'Drop texture maps here' : 'Drop files here'}</b> or click to browse
              </p>
              <span>
                {imagesOnly
                  ? 'Albedo · Normal · Roughness · Metalness · AO · Emissive — role auto-detected from the filename'
                  : 'Models: GLB · GLTF · OBJ · FBX — Textures: PNG · JPG · WEBP · TGA · EXR'}
              </span>
            </div>
          )}

          {showBlock && (
            <>
              {/* Model / other file rows */}
              {fileListEntries.length > 0 && (
                <div className="file-list">
                  {fileListEntries.map((e) => (
                    <div className="file-row" key={e.id}>
                      <span className={'file-ic ' + e.group}>
                        {e.group === 'model' ? '◳' : e.group === 'image' ? '🖼' : '📄'}
                      </span>
                      <div className="file-meta">
                        <span className="file-name">{e.file?.name || e.name}</span>
                        <span className="file-sub">
                          {e.sizeBytes ? formatBytes(e.sizeBytes) : '—'}
                          {e.status === 'pending' && ' · analyzing…'}
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
              )}

              {/* Texture maps attached to the model */}
              {type === 'model' && (
                <div className="maps-edit">
                  <div className="maps-edit-head">
                    <span>Texture maps</span>
                    {maps.length > 0 && <em>{maps.length} · {formatBytes(mapsBytes)}</em>}
                  </div>
                  {maps.length === 0 ? (
                    <p className="maps-empty">
                      No textures attached. {imagesOnly ? 'Drop maps above' : 'Drop albedo / normal / roughness… with the model'} to build the set.
                    </p>
                  ) : (
                    <div className="map-list">
                      {maps.map((e) => (
                        <div className="map-item" key={e.id}>
                          <span className="map-thumb">
                            {e.url ? <img src={e.url} alt="" /> : <span className="map-thumb-ph">{(e.ext || '?').toUpperCase()}</span>}
                          </span>
                          <div className="file-meta">
                            <span className="file-name">{e.file?.name || e.name}</span>
                            <span className="file-sub">
                              {e.status === 'pending'
                                ? 'analyzing…'
                                : e.width > 0
                                ? `${e.width}×${e.height}`
                                : ['tga', 'exr'].includes(e.ext)
                                ? 'no pixel preview'
                                : 'dimensions n/a'}
                              {e.sizeBytes ? ` · ${formatBytes(e.sizeBytes)}` : ''}
                            </span>
                          </div>
                          <select
                            className="map-role"
                            value={e.role || 'other'}
                            onChange={(ev) => setRole(e.id, ev.target.value)}
                            aria-label="Texture role"
                          >
                            {MAP_ROLES.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                          <button className="file-x" onClick={() => removeEntry(e.id)} aria-label="Remove texture">
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Detected summary (création seulement) */}
              {!isEdit && (
                <div className="detected">
                  <span className="det-chip">
                    Type <b>{type === 'model' ? '3D model' : type === 'texture' ? 'Texture' : '—'}</b>
                  </span>
                  <span className="det-chip">
                    Format <b>{formats.join(' · ') || '—'}</b>
                  </span>
                  {type === 'model' ? (
                    <>
                      <span className="det-chip">
                        Tris <b>{tris != null ? tris.toLocaleString('en-US') : '—'}</b>
                      </span>
                      {maps.length > 0 && (
                        <span className="det-chip">
                          Maps <b>{maps.length}</b>
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="det-chip">
                      Resolution <b>{maxDim > 0 ? `${primaryImage.width}×${primaryImage.height} (${res})` : '—'}</b>
                    </span>
                  )}
                  <span className="det-chip">
                    Size <b>{formatBytes(totalSize || 0)}</b>
                  </span>
                </div>
              )}

              {/* Live preview */}
              <div className="upload-preview">{isEdit ? renderEditPreview() : renderCreatePreview()}</div>
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
            {pending
              ? 'Analyzing files…'
              : isEdit
              ? `Editing “${editAsset.name}”`
              : entries.length === 0
              ? 'Add at least one file'
              : `${entries.length} file(s) ready`}
          </span>
          <div className="foot-actions">
            <button className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" disabled={!canSubmit} onClick={submit}>
              {isEdit ? 'Save changes' : '+ Add to library'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
