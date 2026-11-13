import { Phone } from "lucide-react"
import type { CustomerSuggestion } from "../../lib/api/staff"

/**
 * "Is this your number?": the numbers saved for customers with the name typed, with the middle hidden. Tap one to
 * choose that customer; if yours is not there, type it in the box above. It narrows as more digits are typed.
 */
export function NumberSuggestions({
  items,
  more,
  onPick,
  className = "",
}: {
  items: CustomerSuggestion[]
  more?: boolean
  onPick: (item: CustomerSuggestion) => void
  className?: string
}) {
  if (items.length === 0) return null
  return (
    <div
      className={`overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface)] shadow-[0_8px_24px_rgba(0,0,0,0.25)] animate-fade-in ${className}`}
      role="group"
      aria-label="Saved numbers for this name"
    >
      <div className="border-b border-[var(--border-subtle)] px-4 py-2.5 text-xs text-[var(--text-secondary)]">
        {items.length === 1 ? "Is this your number? Tap it." : "Is one of these your number? Tap it."}
      </div>
      <ul className="divide-y divide-[var(--border-subtle)]">
        {items.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left active:bg-[var(--elevated)]"
              onClick={() => onPick(c)}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--elevated)] text-[var(--text-secondary)]">
                <Phone size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-xl font-600 tracking-[0.12em] text-[var(--text)] [font-variant-numeric:tabular-nums]">
                  +91 {c.maskedPhone}
                </span>
                {c.visits > 0 && (
                  <span className="block text-[11px] text-[var(--text-muted)]">
                    {c.visits} visit{c.visits === 1 ? "" : "s"} so far
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="border-t border-[var(--border-subtle)] px-4 py-2.5 text-[11px] text-[var(--text-muted)]">
        {more ? "More numbers match: type more digits to narrow it down. " : ""}
        Not here? Type your number in the box above.
      </div>
    </div>
  )
}
