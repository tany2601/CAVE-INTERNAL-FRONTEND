import { useEffect, useState } from "react"
import { Button, Logo } from "../../components/ui"
import { staffApi } from "../../lib/api"
import { formatAmount } from "../../lib/format"
import { dayKeyOf, greeting, longDate } from "../../lib/greeting"
import { round2 } from "../../lib/money"
import type { ApiDay } from "../../types/api"

interface Props {
  /** Day being closed (YYYY-MM-DD). Today when left out; an earlier day when catching up. */
  date?: string
  /** Saves the counted balances. Throw to show an error and stay on the screen. */
  onSave: (actualCash: number, actualGpay: number) => Promise<void> | void
  onSkip: () => void
}

/**
 * Closing the books: shows what the ledger says the till should hold, takes the counted cash and
 * GPay, and shows any difference before confirming. Mirrors the morning opening screen.
 */
export default function EveningClosing({ date, onSave, onSkip }: Props) {
  const today = dayKeyOf()
  const key = date ?? today
  const isToday = key === today
  const [day, setDay] = useState<ApiDay | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [cash, setCash] = useState("")
  const [gpay, setGpay] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    staffApi
      .getDay(key)
      .then((d) => live && setDay(d))
      .catch((e) => live && setLoadError(e instanceof Error ? e.message : "Could not load the day."))
    return () => {
      live = false
    }
  }, [key])

  const expectedCash = day?.expectedCash ?? 0
  const expectedGpay = day?.expectedGpay ?? 0
  const filled = cash !== "" && gpay !== ""

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg)] flex flex-col overflow-y-auto animate-slide-up">
      <div className="relative z-10 flex flex-col min-h-full gap-7 px-6 pt-page-fluid pb-[max(1.5rem,var(--sab))] justify-between">
        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-2">
            <Logo size="sm" />
            <div className="text-[10px] text-[var(--text-muted)] tracking-[0.2em] uppercase mt-2">
              {longDate(key)}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="font-display font-800 text-4xl tracking-wider text-[var(--text)]">
              {isToday ? greeting() : "Close the books"}
            </h1>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              {isToday
                ? "Time to close the day. Count the cash and check the GPay balance."
                : `Count what ${longDate(key)} ended with. It was not closed on the day.`}
            </p>
          </div>

          {day && !day.openingSet && (
            <div className="rounded-sm border border-[rgba(128,128,128,0.3)] bg-[var(--surface)] p-3 text-[11px] leading-relaxed text-[var(--text-muted)]">
              No opening balance was recorded for this day, so the expected amounts below start from ₹0.
            </div>
          )}

          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-sm px-4 py-3">
            <div className="text-[10px] text-[var(--text-muted)] tracking-wider mb-2">Expected by the ledger</div>
            {loadError ? (
              <div className="py-3 text-xs text-[#E06060]">{loadError}</div>
            ) : !day ? (
              <div className="py-3 text-xs text-[var(--text-muted)]">Loading…</div>
            ) : (
              <>
                <Row label="Cash" value={formatAmount(expectedCash)} />
                <Row label="GPay" value={formatAmount(expectedGpay)} />
              </>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <Field label="Actual cash counted" value={cash} onChange={setCash} />
            <Field label="Actual GPay received" value={gpay} onChange={setGpay} />
          </div>

          {filled && day && (
            <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-sm px-4 py-3 flex flex-col gap-2 animate-fade-in">
              <Diff label="Cash" expected={expectedCash} actual={Number(cash)} />
              <Diff label="GPay" expected={expectedGpay} actual={Number(gpay)} />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {error && <div className="text-xs text-[#E06060] tracking-wide text-center">{error}</div>}
          <Button
            variant="primary"
            fullWidth
            size="lg"
            disabled={saving || !filled || !day}
            onClick={async () => {
              setSaving(true)
              setError(null)
              try {
                await onSave(Number(cash), Number(gpay))
              } catch (e) {
                setError(e instanceof Error ? e.message : "Could not close the books.")
                setSaving(false)
              }
            }}
          >
            {saving ? "Closing…" : isToday ? "Verify & Close Day" : "Verify & close this day"}
          </Button>
          <Button variant="ghost" fullWidth size="md" onClick={onSkip}>
            Skip for now
          </Button>
          <p className="text-center text-[10px] leading-relaxed text-[var(--text-subtle)]">
            Skipped? You can close it later from Cash, or tomorrow when the app asks again.
          </p>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span className="font-display font-700 text-base text-[var(--text)]">{value}</span>
    </div>
  )
}

function Diff({ label, expected, actual }: { label: string; expected: number; actual: number }) {
  const diff = round2(actual - expected)
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-[var(--text-muted)]">{label} difference</span>
      <span className={`font-display font-700 text-sm ${diff < 0 ? "text-[#E06060]" : "text-[#4CAF86]"}`}>
        {diff > 0 ? "+" : ""}
        {formatAmount(diff)}
      </span>
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)]">{label}</label>
      <div className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-sm px-4 py-3 focus-within:border-[#3D6FA8] transition-colors">
        <span className="font-display font-700 text-xl text-[var(--text-faint)]">₹</span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          className="flex-1 min-w-0 bg-transparent text-[var(--text)] text-2xl font-display font-600 outline-none placeholder-[var(--text-faint)]"
          placeholder="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}
