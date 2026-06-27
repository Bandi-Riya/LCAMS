import { useEffect, useRef } from 'react'

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}) {
  const cardRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    const prevActive = document.activeElement
    cardRef.current?.focus()

    function onKeyDown(e) {
      if (e.key === 'Escape') onCancel?.()
      if (e.key !== 'Tab') return

      const focusables = cardRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusables || focusables.length === 0) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      prevActive?.focus?.()
    }
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel?.()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 1000,
      }}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Confirm'}
        tabIndex={-1}
        className="card"
        style={{
          width: '100%',
          maxWidth: 520,
          borderRadius: 12,
          outline: 'none',
        }}
      >
        <div style={{ marginBottom: 10, fontSize: 18, fontWeight: 700 }}>
          {title || 'Confirm'}
        </div>
        <div style={{ color: 'var(--color-text-light)', marginBottom: 18 }}>
          {message || 'Are you sure?'}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

