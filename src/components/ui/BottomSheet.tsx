import type { ReactNode } from "react"

export function BottomSheet({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col justify-end"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <div
        className="bg-[var(--surface)] rounded-t-xl border-t border-[var(--border-subtle)] max-h-[90vh] flex flex-col animate-sheet-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)] flex-shrink-0">
          <span className="font-display font-700 tracking-wider uppercase text-sm text-[var(--text)]">
            {title}
          </span>
          <button
            className="text-[var(--text-muted)] text-xs tracking-widest uppercase tap-target p-1"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}
