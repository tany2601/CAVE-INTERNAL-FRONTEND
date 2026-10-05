import { useEffect, useMemo, useRef, useState } from "react"
import { CalendarRange, ChevronLeft, ChevronRight } from "lucide-react"
import { formatRange, parseDayKey, toDayKey, todayKey } from "../../../lib/dates"

export interface DateRange {
  from?: string
  to?: string
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]

/**
 * Pick a custom date range: tap a start day, then an end day. A one-day range is a double tap.
 * Opens as a popover under its button; nothing is applied until both ends are chosen.
 */
export function DateRangePicker({
  value,
  onChange,
  autoOpen = false,
}: {
  value: DateRange
  onChange: (range: DateRange) => void
  /** Open straight away (used right after switching to the Custom tab with no range yet). */
  autoOpen?: boolean
}) {
  const [open, setOpen] = useState(autoOpen)
  const [draft, setDraft] = useState<DateRange>(value)
  const anchor = value.from ? parseDayKey(value.from) : new Date()
  const [view, setView] = useState(new Date(anchor.getFullYear(), anchor.getMonth(), 1))
  const box = useRef<HTMLDivElement>(null)
  const today = todayKey()

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("pointerdown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const cells = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1)
    const lead = (first.getDay() + 6) % 7 // Monday-first
    const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate()
    return [
      ...Array.from({ length: lead }, () => null),
      ...Array.from({ length: days }, (_, i) => toDayKey(new Date(view.getFullYear(), view.getMonth(), i + 1))),
    ]
  }, [view])

  const pick = (key: string) => {
    if (!draft.from || draft.to) return setDraft({ from: key }) // start a new range
    if (key < draft.from) return setDraft({ from: key }) // earlier than start: restart there
    const next = { from: draft.from, to: key }
    setDraft(next)
    onChange(next)
    setOpen(false)
  }

  const inRange = (key: string) => {
    const end = draft.to ?? draft.from
    return !!draft.from && !!end && key >= draft.from && key <= end
  }

  const label = value.from && value.to ? formatRange(value.from, value.to) : "Select dates"

  return (
    <div className="relative w-full sm:w-auto" ref={box}>
      <button
        type="button"
        className="admin-select select-trigger w-full sm:w-64"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setDraft(value)
          setOpen((o) => !o)
        }}
      >
        <span className="select-leading">
          <CalendarRange size={15} />
        </span>
        <span className={`select-value ${value.from ? "" : "select-placeholder"}`}>{label}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose a date range"
          className="absolute left-0 z-40 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.35)] animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="admin-icon-button"
              aria-label="Previous month"
              onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
            >
              <ChevronLeft size={15} />
            </button>
            <div className="font-display font-700 tracking-widest uppercase text-sm">
              {view.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </div>
            <button
              type="button"
              className="admin-icon-button"
              aria-label="Next month"
              onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
            >
              <ChevronRight size={15} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1 mt-3 text-center">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] py-1">
                {d}
              </div>
            ))}
            {cells.map((key, i) =>
              key ? (
                <button
                  key={key}
                  type="button"
                  onClick={() => pick(key)}
                  className={`h-9 text-xs transition-colors ${
                    key === draft.from || key === draft.to
                      ? "bg-[var(--text)] text-[var(--bg)] font-600 rounded-lg"
                      : inRange(key)
                        ? "bg-[var(--elevated)] text-[var(--text)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--elevated)] rounded-lg"
                  } ${key === today && key !== draft.from && key !== draft.to ? "ring-1 ring-[#4CAF86] rounded-lg" : ""}`}
                >
                  {Number(key.slice(8))}
                </button>
              ) : (
                <div key={`b${i}`} />
              ),
            )}
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
            <span>
              {draft.from && !draft.to
                ? `${formatRange(draft.from, draft.from)} → pick the last day`
                : "Tap a start day, then an end day"}
            </span>
            {draft.from && (
              <button
                type="button"
                className="underline"
                onClick={() => setDraft({})}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
