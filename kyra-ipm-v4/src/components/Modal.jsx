import { useEffect, useRef } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'

export default function Modal({ isOpen, onClose, title, children, footer, triggerRef }) {
  const boxRef = useRef(null)
  const headingId = 'modal-heading'

  // Store onClose and triggerRef in refs so the effect never re-runs due to
  // them changing (onClose is often an inline arrow in the parent, which
  // creates a new reference on every parent re-render / every keystroke).
  const onCloseRef = useRef(onClose)
  const triggerRefStore = useRef(triggerRef)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])
  useEffect(() => { triggerRefStore.current = triggerRef }, [triggerRef])

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = ''
      triggerRefStore.current?.current?.focus()
      return
    }

    // Focus first input/select/textarea, not the close button
    const allFocusable = Array.from(boxRef.current?.querySelectorAll(FOCUSABLE) || [])
    const firstInput = allFocusable.find(el =>
      el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA'
    )
    ;(firstInput || allFocusable[0])?.focus()

    const handleKey = (e) => {
      if (e.key === 'Escape') { onCloseRef.current(); return }
      if (e.key !== 'Tab') return

      const focusables = Array.from(boxRef.current?.querySelectorAll(FOCUSABLE) || [])
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }

    const box = boxRef.current
    box?.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'

    return () => {
      box?.removeEventListener('keydown', handleKey)
    }
  }, [isOpen]) // ONLY isOpen — prevents re-runs on every parent re-render

  if (!isOpen) return null

  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onCloseRef.current() }}
    >
      <div
        className="modal-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        ref={boxRef}
      >
        <div className="modal-header">
          <h2 id={headingId} className="modal-title">{title}</h2>
          <button
            className="modal-close"
            onClick={() => onCloseRef.current()}
            aria-label="Cerrar"
          >×</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
