export default function Toasts({ toasts, onDismiss }) {
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={'toast ' + (t.kind || 'info')} onClick={() => onDismiss(t.id)}>
          <span className="toast-ic">{t.kind === 'success' ? '✓' : t.kind === 'fav' ? '♥' : 'ℹ'}</span>
          <span className="toast-msg">{t.msg}</span>
        </div>
      ))}
    </div>
  )
}
