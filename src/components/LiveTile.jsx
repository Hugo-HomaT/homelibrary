import { useEffect, useRef, useState } from 'react'
import { ModelStage, UploadedModelStage, TextureViewer, UploadedTextureViewer } from './Model3D'
import { hasWebGL } from '../lib/webgl'

/* LiveTile — la vignette elle-même s'agrandit EN PLACE au survol (animation width/height,
   pas de scale → toujours net) et un rendu 3D léger s'y allume. Aucune carte flottante :
   c'est le même élément, sur fond clair continu, qui morph. La rangée s'agrandit pour
   faire la place. Le canvas n'est monté que pendant le survol (un seul contexte WebGL).

   preview = { type:'model'|'texture', uploaded, object3d?, kind?, palette?, url?, pattern?, seed? }
   image   = url de l'aperçu statique au repos (net) · fallback = noeud si pas d'image */
export default function LiveTile({ preview, label, image, fallback }) {
  const [active, setActive] = useState(false)
  const enterT = useRef()
  const leaveT = useRef()

  const canPreview =
    hasWebGL() &&
    !!preview &&
    (preview.type === 'model'
      ? preview.uploaded
        ? !!preview.object3d
        : !!preview.kind
      : preview.uploaded
      ? !!preview.url
      : !!preview.pattern)

  const onEnter = () => {
    if (!canPreview) return
    clearTimeout(leaveT.current)
    enterT.current = setTimeout(() => setActive(true), 80)
  }
  const onLeave = () => {
    clearTimeout(enterT.current)
    leaveT.current = setTimeout(() => setActive(false), 110)
  }
  useEffect(
    () => () => {
      clearTimeout(enterT.current)
      clearTimeout(leaveT.current)
    },
    []
  )

  const renderCanvas = () => {
    if (preview.type === 'model') {
      return preview.uploaded ? (
        <UploadedModelStage object={preview.object3d} />
      ) : (
        <ModelStage kind={preview.kind} palette={preview.palette} />
      )
    }
    return preview.uploaded ? (
      <UploadedTextureViewer url={preview.url} shape="sphere" stage />
    ) : (
      <TextureViewer pattern={preview.pattern} palette={preview.palette} seed={preview.seed} shape="sphere" stage />
    )
  }

  // Pas d'aperçu statique (ex. modèle tout juste uploadé, sans thumbnail pré-rendu) →
  // on rend le mini 3D directement au repos. Sinon : image statique, 3D au survol.
  const eager = canPreview && !image

  return (
    <span
      className={'live-tile' + (canPreview ? ' can' : '') + (active ? ' active' : '') + (eager ? ' eager' : '')}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      role="img"
      aria-label={label || '3D preview'}
    >
      {!eager && <span className="lt-still">{image ? <img src={image} alt="" /> : fallback}</span>}
      {(eager || active) && <span className="lt-3d">{renderCanvas()}</span>}
    </span>
  )
}
