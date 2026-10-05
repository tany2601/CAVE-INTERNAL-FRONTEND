/** "Scroll sideways" cue for wide tables; only shown on phones, where the table actually overflows. */
export function ScrollHint() {
  return (
    <div className="sm:hidden border-b border-[var(--border-subtle)] bg-[var(--elevated)] px-3 py-2 text-center text-xs font-600 uppercase tracking-widest text-[var(--text-muted)]">
      ← Scroll for more →
    </div>
  )
}
