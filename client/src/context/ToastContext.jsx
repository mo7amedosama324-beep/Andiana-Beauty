import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

const ToastContext = createContext(null)

function createToastId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function ToastProvider({ children }) {
  const timers = useRef(new Map())
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    const timer = timers.current.get(id)
    if (timer) window.clearTimeout(timer)
    timers.current.delete(id)
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback((toast) => {
    const id = createToastId()
    setToasts((current) => [...current, { id, type: 'info', title: '', message: '', ...toast }])
    const timer = window.setTimeout(() => dismiss(id), 3000)
    timers.current.set(id, timer)
    return id
  }, [dismiss])

  const value = useMemo(() => ({ pushToast, dismiss }), [pushToast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed inset-x-0 top-4 z-[100] mx-auto flex w-full max-w-lg flex-col gap-2 px-4 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`slide-in pointer-events-auto rounded-2xl px-4 py-3 shadow-elevated backdrop-blur-sm ${
              toast.type === 'success'
                ? 'bg-stone-900 text-white'
                : toast.type === 'error'
                  ? 'border border-rose-200 bg-rose-50 text-rose-600'
                  : 'border border-amber-200 bg-amber-50 text-amber-700'
            }`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-sm font-semibold">
                {toast.type === 'success' ? '✓' : toast.type === 'error' ? '!' : 'i'}
              </span>
              <div className="min-w-0 flex-1">
                {toast.title ? <p className="text-sm font-semibold">{toast.title}</p> : null}
                <p className="text-sm leading-6 opacity-95">{toast.message}</p>
              </div>
              <button
                type="button"
                className="rounded-full px-2 py-0.5 text-xs font-semibold opacity-70 transition hover:opacity-100"
                onClick={() => dismiss(toast.id)}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
