export default function ConfirmModal({ open, title, body, confirmLabel, cancelLabel, onConfirm, onCancel }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-stone-900/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[1.75rem] border border-white/40 bg-white/95 p-6 shadow-elevated">
        <h3 className="font-display text-2xl text-stone-900">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-stone-600">{body}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="button-surface bg-stone-900 text-white" onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button type="button" className="button-surface border border-stone-200 bg-sand-50 text-stone-700" onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
