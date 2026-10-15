import { useEffect, useId, useRef, type ReactNode } from 'react'

const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function focusableElements(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((element) => !element.closest('[hidden]'))
}

export function Dialog({
  title,
  onClose,
  children,
  initialFocusSelector,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  initialFocusSelector?: string
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  const titleId = useId()
  onCloseRef.current = onClose

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const root = dialogRef.current
    if (!root) return

    const preferred = initialFocusSelector ? root.querySelector<HTMLElement>(initialFocusSelector) : null
    const items = focusableElements(root)
    ;(preferred ?? items[0] ?? root).focus()

    function onKeyDown(event: KeyboardEvent) {
      if (!root) return
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const current = focusableElements(root)
      if (current.length === 0) {
        event.preventDefault()
        root.focus()
        return
      }
      const first = current[0]
      const last = current[current.length - 1]
      const active = document.activeElement
      if (event.shiftKey) {
        if (active === first || !root.contains(active)) {
          event.preventDefault()
          last.focus()
        }
        return
      }
      if (active === last || !root.contains(active)) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      if (opener?.isConnected) {
        opener.focus()
        return
      }
      document.getElementById('create-task')?.focus()
    }
  }, [initialFocusSelector])

  return (
    <div className="dialog-backdrop">
      <div
        ref={dialogRef}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="dialog-header">
          <h2 id={titleId}>{title}</h2>
        </header>
        {children}
      </div>
    </div>
  )
}
