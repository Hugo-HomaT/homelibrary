import TextureSwatch from './TextureSwatch'
import { KIND_EMOJI } from '../data'

export default function SelectionDrawer({ open, items, onClose, onRemove, onClear, onExport }) {
  return (
    <>
      <div className={'drawer-backdrop' + (open ? ' open' : '')} onClick={onClose} />
      <aside className={'drawer' + (open ? ' open' : '')} aria-hidden={!open}>
        <div className="drawer-head">
          <h3>Selection <span className="drawer-count">{items.length}</span></h3>
          <button className="drawer-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {items.length === 0 ? (
          <div className="drawer-empty">
            <div className="empty-emoji">🧺</div>
            <p>Your selection is empty</p>
            <span>Add assets to build a pack and export it into your project.</span>
          </div>
        ) : (
          <>
            <div className="drawer-list">
              {items.map((a) => (
                <div className="drawer-item" key={a.id}>
                  <div className="di-thumb">
                    {a.type === 'model' ? (
                      <span className="di-emoji">{KIND_EMOJI[a.kind] || '📦'}</span>
                    ) : (
                      <TextureSwatch pattern={a.pattern} palette={a.palette} seed={a.id} size={56} className="di-swatch" />
                    )}
                  </div>
                  <div className="di-info">
                    <span className="di-name">{a.name}</span>
                    <span className="di-meta">
                      {a.type === 'model' ? `3D model · ${a.size}` : `Texture ${a.res} · ${a.size}`}
                    </span>
                  </div>
                  <button className="di-remove" onClick={() => onRemove(a.id)} aria-label="Remove">×</button>
                </div>
              ))}
            </div>

            <div className="drawer-footer">
              <div className="drawer-summary">
                <span>{items.length} asset{items.length > 1 ? 's' : ''}</span>
                <span>{items.filter((a) => a.type === 'model').length} models · {items.filter((a) => a.type === 'texture').length} textures</span>
              </div>
              <button className="btn-primary full" onClick={onExport}>↓ Export pack (.zip)</button>
              <button className="btn-text" onClick={onClear}>Clear all</button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
