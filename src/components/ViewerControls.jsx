const MODES = [
  ['shaded', 'Shaded'],
  ['wire', 'Wire'],
  ['shadedwire', 'Shaded + wire'],
]

export default function ViewerControls({ mode, onMode, autoRotate, onAutoRotate }) {
  return (
    <div className="viewer-controls">
      <button className={'vc-btn' + (autoRotate ? ' on' : '')} onClick={onAutoRotate}>
        ⟲ Rotate
      </button>
      <div className="vc-seg">
        {MODES.map(([id, label]) => (
          <button key={id} className={mode === id ? 'on' : ''} onClick={() => onMode(id)}>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
