import { Check } from "lucide-react"

const STEPS = ["Customer", "Services", "Products", "Bill"]

/** "1 Customer → 2 Services → 3 Products → 4 Bill": where the person is in a quick bill, in plain words. */
export function QuickSteps({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <ol className="flex items-start gap-1" aria-label={`Step ${current} of 4`}>
      {STEPS.map((label, i) => {
        const n = i + 1
        const done = n < current
        const active = n === current
        return (
          <li key={label} className="flex flex-1 flex-col items-center gap-1" aria-current={active ? "step" : undefined}>
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full border font-display text-sm font-700 ${
                active
                  ? "border-[var(--text)] bg-[var(--text)] text-[var(--bg)]"
                  : done
                    ? "border-[#4CAF86] bg-[#4CAF86] text-black"
                    : "border-[var(--border)] text-[var(--text-muted)]"
              }`}
            >
              {done ? <Check size={15} strokeWidth={3} /> : n}
            </span>
            <span className={`text-[11px] ${active ? "font-600 text-[var(--text)]" : "text-[var(--text-muted)]"}`}>{label}</span>
          </li>
        )
      })}
    </ol>
  )
}
