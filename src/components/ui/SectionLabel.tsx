import type { ReactNode } from "react"

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-[10px] font-medium tracking-widest uppercase text-[var(--text-muted)]">
        {children}
      </span>
      <div className="flex-1 border-t border-[var(--border-subtle)]" />
    </div>
  )
}
