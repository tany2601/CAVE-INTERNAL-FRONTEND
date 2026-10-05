import { useState } from "react"
import { Button, SectionLabel, AmountRow, Badge } from "../../components/ui"
import { formatAmount } from "../../lib/format"
import { useBranchData } from "../../context/BranchDataContext"
import { staffApi } from "../../lib/api"
import { AlertCircle, X } from "lucide-react"
import { ManagerNav } from "../../components/layout"

interface Props {
  onNav: (screen: string) => void
  navTab: string
  openingCash: number
  openingGpay: number
}

export default function Cash({
  onNav,
  navTab,
  openingCash,
  openingGpay,
}: Props) {
  const { closedSessions, expenses, payouts, day, refresh } = useBranchData()
  const cashRevenue = closedSessions
    .filter((s) => s.paymentMode === "cash")
    .reduce((a, s) => a + (s.total || 0), 0)
  const gpayRevenue = closedSessions
    .filter((s) => s.paymentMode === "gpay")
    .reduce((a, s) => a + (s.total || 0), 0)
  const cashExpenses = expenses
    .filter((e) => e.paymentMode === "cash")
    .reduce((a, e) => a + e.amount, 0)
  const gpayExpenses = expenses
    .filter((e) => e.paymentMode === "gpay")
    .reduce((a, e) => a + e.amount, 0)
  const cashPayouts = payouts
    .filter((p) => p.paymentMode === "CASH")
    .reduce((a, p) => a + p.amount, 0)
  const gpayPayouts = payouts
    .filter((p) => p.paymentMode === "GPAY")
    .reduce((a, p) => a + p.amount, 0)
  const expectedCash = openingCash + cashRevenue - cashExpenses - cashPayouts
  const expectedGpay = openingGpay + gpayRevenue - gpayExpenses - gpayPayouts
  const [showClosing, setShowClosing] = useState(false)
  const [actualCash, setActualCash] = useState("")
  const [actualGpay, setActualGpay] = useState("")
  const [closing, setClosing] = useState(false)
  const [closeError, setCloseError] = useState<string | null>(null)
  const dayClosed = !!day?.closed

  return (
    <div className="flex flex-col h-full bg-[var(--bg)]">
      <div className="flex-1 overflow-y-auto pb-nav">
        {/* Header */}
        <div className="px-5 pt-page pb-5 border-b border-[var(--border-subtle)]">
          <div className="text-[10px] tracking-[0.25em] uppercase text-[var(--text-subtle)]">
            Branch
          </div>
          <div className="font-display font-800 text-2xl tracking-wider text-[var(--text)] mt-0.5">
            Cash
          </div>
        </div>

        <div className="px-5 py-5 flex flex-col gap-5">
          {dayClosed ? (
            <div className="flex flex-col items-center justify-center py-16 gap-5">
              <div className="w-16 h-16 rounded-full bg-[rgba(46,125,88,0.1)] border border-[rgba(46,125,88,0.2)] flex items-center justify-center">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 28 28"
                  fill="none"
                  className="text-[#4CAF86]"
                >
                  <path
                    d="M6 14l6 6 10-12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="font-display font-800 tracking-[0.15em] uppercase text-xl text-[var(--text)]">
                Day Closed
              </div>
              <div className="text-[11px] text-[var(--text-subtle)] tracking-wider">
                Books are closed for today.
              </div>
            </div>
          ) : (
            <>
              {/* Morning opening */}
              <div>
                <SectionLabel>Morning Opening</SectionLabel>
                <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-sm">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
                    <span className="text-[10px] tracking-widest uppercase text-[var(--text-subtle)]">
                      Status
                    </span>
                    <span
                      className={`inline-flex items-center justify-center min-w-[4.75rem] shrink-0 whitespace-nowrap text-[9px] tracking-widest uppercase px-2 py-1 rounded-full border ${
                        openingCash > 0
                          ? "text-[#4CAF86] border-[rgba(46,125,88,0.25)] bg-[rgba(46,125,88,0.08)]"
                          : "text-[var(--text-secondary)] border-[rgba(128,128,128,0.25)] bg-[rgba(128,128,128,0.08)]"
                      }`}
                    >
                      {openingCash > 0 ? "Entered" : "Pending"}
                    </span>
                  </div>
                  <div className="px-4 py-3">
                    <AmountRow
                      label="Opening Cash"
                      value={formatAmount(openingCash)}
                    />
                    <AmountRow
                      label="Opening GPay"
                      value={formatAmount(openingGpay)}
                    />
                  </div>
                </div>
              </div>

              {/* Flow summary */}
              <div>
                <SectionLabel>Today's Flow</SectionLabel>
                <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-sm px-4 py-3 flex flex-col gap-0">
                  <AmountRow
                    label="Cash Revenue"
                    value={formatAmount(cashRevenue)}
                  />
                  <AmountRow
                    label="GPay Revenue"
                    value={formatAmount(gpayRevenue)}
                  />
                  <AmountRow
                    label="Cash Expenses"
                    value={`-${formatAmount(cashExpenses)}`}
                    muted
                  />
                  {gpayExpenses > 0 && (
                    <AmountRow
                      label="GPay Expenses"
                      value={`-${formatAmount(gpayExpenses)}`}
                      muted
                    />
                  )}
                  {cashPayouts > 0 && (
                    <AmountRow
                      label="Cash Payouts"
                      value={`-${formatAmount(cashPayouts)}`}
                      muted
                    />
                  )}
                  {gpayPayouts > 0 && (
                    <AmountRow
                      label="GPay Payouts"
                      value={`-${formatAmount(gpayPayouts)}`}
                      muted
                    />
                  )}
                  <div className="border-t border-[var(--border-subtle)] mt-2 pt-3">
                    <AmountRow
                      label="Expected Cash"
                      value={formatAmount(expectedCash)}
                      bold
                    />
                    <AmountRow
                      label="Expected GPay"
                      value={formatAmount(expectedGpay)}
                      bold
                    />
                  </div>
                </div>
              </div>

              {/* Evening closing */}
              <div>
                <SectionLabel>Evening Closing</SectionLabel>
                <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-sm p-4 flex flex-col gap-4">
                  <ClosingInput
                    label="Actual Cash Counted"
                    value={actualCash}
                    onChange={setActualCash}
                  />
                  <ClosingInput
                    label="Actual GPay Received"
                    value={actualGpay}
                    onChange={setActualGpay}
                  />

                  {actualCash && actualGpay && (
                    <div className="border-t border-[var(--border-subtle)] pt-3 flex flex-col gap-2 animate-fade-in">
                      <DiffRow
                        label="Cash"
                        expected={expectedCash}
                        actual={Number(actualCash)}
                      />
                      <DiffRow
                        label="GPay"
                        expected={expectedGpay}
                        actual={Number(actualGpay)}
                      />
                    </div>
                  )}

                  <Button
                    variant="primary"
                    fullWidth
                    size="lg"
                    disabled={!actualCash || !actualGpay}
                    onClick={() => setShowClosing(true)}
                  >
                    Verify &amp; Close Day
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Closing confirmation sheet */}
      {showClosing && (
        <div
          className="fixed inset-0 z-[60] flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.75)" }}
        >
          <div className="bg-[var(--surface)] border-t border-[var(--border-subtle)] rounded-t-xl p-6 max-h-[92dvh] overflow-y-auto animate-sheet-up flex flex-col gap-5">
            <div className="flex items-start justify-between">
              <div className="font-display font-700 tracking-wider uppercase text-sm text-[var(--text)]">
                Close today's books?
              </div>
              <button
                className="text-[var(--text-muted)] tap-target"
                onClick={() => setShowClosing(false)}
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <CompareRow
                label="Cash"
                expected={expectedCash}
                actual={Number(actualCash)}
              />
              <CompareRow
                label="GPay"
                expected={expectedGpay}
                actual={Number(actualGpay)}
              />
            </div>
            {closeError && (
              <div className="text-xs text-[#E06060] tracking-wide text-center">
                {closeError}
              </div>
            )}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowClosing(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                disabled={closing}
                onClick={async () => {
                  setClosing(true)
                  setCloseError(null)
                  try {
                    await staffApi.closeDay(
                      Number(actualCash),
                      Number(actualGpay),
                    )
                    await refresh()
                    setShowClosing(false)
                  } catch (e) {
                    setCloseError(
                      e instanceof Error ? e.message : "Could not close the day.",
                    )
                  } finally {
                    setClosing(false)
                  }
                }}
              >
                {closing ? "Closing…" : "Confirm Close"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ManagerNav active={navTab} onSelect={onNav} />
    </div>
  )
}

function ClosingInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[9px] tracking-widest uppercase text-[var(--text-subtle)]">
        {label}
      </label>
      <div className="flex items-center gap-2 bg-[var(--surface-soft)] border border-[var(--border)] rounded-sm px-4 py-3 focus-within:border-[#3D6FA8] transition-colors">
        <span className="text-[var(--text-faint)] font-display font-800 text-xl">
          ₹
        </span>
        <input
          type="number"
          inputMode="numeric"
          className="flex-1 bg-transparent text-[var(--text)] text-xl font-display font-700 outline-none placeholder-[var(--text-faint)]"
          placeholder="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}

function DiffRow({
  label,
  expected,
  actual,
}: {
  label: string
  expected: number
  actual: number
}) {
  const diff = actual - expected
  const color = diff === 0 ? "#4CAF86" : diff < 0 ? "#E06060" : "#4CAF86"
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-[var(--text-muted)]">
        {label} difference
      </span>
      <span className="font-display font-700 text-sm" style={{ color }}>
        {diff >= 0 ? "+" : ""}
        {formatAmount(diff)}
      </span>
    </div>
  )
}

function CompareRow({
  label,
  expected,
  actual,
}: {
  label: string
  expected: number
  actual: number
}) {
  const diff = actual - expected
  return (
    <div className="bg-[var(--surface-soft)] border border-[var(--border-subtle)] rounded-sm p-3 flex flex-col gap-2">
      <div className="text-[9px] tracking-widest uppercase text-[var(--text-subtle)]">
        {label}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[var(--text-muted)]">Expected</span>
        <span className="font-display font-700 text-sm text-[var(--text-secondary)]">
          {formatAmount(expected)}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[var(--text-muted)]">Actual</span>
        <span className="font-display font-700 text-sm text-[var(--text)]">
          {formatAmount(actual)}
        </span>
      </div>
      {diff !== 0 && (
        <div
          className={`flex items-center gap-1.5 text-[11px] ${
            diff < 0 ? "text-[#E06060]" : "text-[#4CAF86]"
          }`}
        >
          <AlertCircle size={11} />
          {diff >= 0 ? "+" : ""}
          {formatAmount(diff)} difference
        </div>
      )}
    </div>
  )
}
