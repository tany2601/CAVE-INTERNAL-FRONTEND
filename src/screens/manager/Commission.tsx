import { EmptyNote } from "../../components/ui"
import { useState } from "react"
import { Badge, SectionLabel, Button } from "../../components/ui"
import { formatAmount } from "../../lib/format"
import { useBranchData } from "../../context/BranchDataContext"
import { staffApi } from "../../lib/api"
import { toApiMode } from "../../lib/mappers"
import { Stylist } from "../../types"
import { X } from "lucide-react"
import { ManagerNav } from "../../components/layout"

interface Props {
  onNav: (screen: string) => void
  navTab: string
}

export default function Commission({ onNav, navTab }: Props) {
  const { stylists, refresh } = useBranchData()
  const [paying, setPaying] = useState<Stylist | null>(null)
  const [payMode, setPayMode] = useState<"cash" | "gpay">("cash")
  const [saving, setSaving] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  // Records the payout in the backend ledger, then refreshes today's data.
  const markPaid = async (stylist: Stylist) => {
    setSaving(true)
    setPayError(null)
    try {
      await staffApi.createPayout({
        userId: stylist.id,
        paymentMode: toApiMode(payMode),
        amount: stylist.commission,
      })
      await refresh()
      setPaying(null)
    } catch (e) {
      setPayError(e instanceof Error ? e.message : "Could not record the payout.")
    } finally {
      setSaving(false)
    }
  }

  const totalPending = stylists
    .filter((s) => !s.commissionPaid)
    .reduce((a, s) => a + s.commission, 0)
  const totalPaid = stylists
    .filter((s) => s.commissionPaid)
    .reduce((a, s) => a + s.commission, 0)

  return (
    <div className="flex flex-col h-full bg-[var(--bg)]">
      <div className="flex-1 overflow-y-auto pb-nav">
        {/* Header */}
        <div className="px-5 pt-page pb-5 border-b border-[var(--border-subtle)]">
          <div className="text-[10px] tracking-[0.25em] uppercase text-[var(--text-subtle)]">
            Today's stylist
          </div>
          <div className="font-display font-800 text-2xl tracking-wider text-[var(--text)] mt-0.5">
            Commission
          </div>

          <div className="flex gap-3 mt-4">
            <div className="flex-1 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-sm p-3">
              <div className="text-[9px] text-[var(--text-subtle)] tracking-widest uppercase mb-1">
                Pending
              </div>
              <div className="font-display font-800 text-xl text-[var(--text)]">
                {formatAmount(totalPending)}
              </div>
            </div>
            <div className="flex-1 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-sm p-3">
              <div className="text-[9px] text-[var(--text-subtle)] tracking-widest uppercase mb-1">
                Paid
              </div>
              <div className="font-display font-800 text-xl text-[#4CAF86]">
                {formatAmount(totalPaid)}
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3">
          <SectionLabel>Staff Payouts</SectionLabel>
          {stylists.length === 0 && (
            <EmptyNote>No staff to pay out yet. Add staff from the admin dashboard.</EmptyNote>
          )}
          {stylists.map((s) => (
            <div
              key={s.id}
              className="bg-[var(--surface)] border border-[var(--border-subtle)]"
              style={{ borderRadius: "4px" }}
            >
              {/* Staff info */}
              <div className="flex items-center gap-3 p-4 pb-3">
                <div className="w-10 h-10 rounded-full bg-[var(--elevated)] border border-[var(--border)] flex items-center justify-center font-display font-800 text-sm text-[var(--text-secondary)] flex-shrink-0">
                  {s.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-800 tracking-wider uppercase text-sm text-[var(--text)]">
                      {s.name}
                    </span>
                    <span
                      className={`inline-flex items-center justify-center min-w-[4.75rem] shrink-0 whitespace-nowrap text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full border ${
                        s.commissionPaid
                          ? "text-[#4CAF86] border-[rgba(46,125,88,0.25)] bg-[rgba(46,125,88,0.08)]"
                          : "text-[var(--text-secondary)] border-[rgba(128,128,128,0.25)] bg-[rgba(128,128,128,0.08)]"
                      }`}
                    >
                      {s.commissionPaid ? "Paid" : "Pending"}
                    </span>
                  </div>
                  <div className="text-[10px] text-[var(--text-subtle)] mt-0.5">
                    {s.completedToday} customers ·{" "}
                    {formatAmount(s.revenueToday)}
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-0 border-t border-[var(--border-subtle)]">
                <MetricCell
                  label="Revenue"
                  value={formatAmount(s.revenueToday)}
                />
                <MetricCell
                  label="Commission"
                  value={formatAmount(s.commission)}
                  highlight
                />
                <MetricCell label="Tips" value={formatAmount(s.tips)} />
              </div>

              {/* CTA */}
              {!s.commissionPaid ? (
                <button
                  className="w-full border-t border-[var(--border-subtle)] py-3 font-display font-700 tracking-[0.2em] uppercase text-xs text-[var(--text)] tap-target active:bg-[var(--text)] active:text-[var(--bg)] transition-all"
                  onClick={() => setPaying(s)}
                >
                  Mark Paid · {formatAmount(s.commission)}
                </button>
              ) : (
                <div className="border-t border-[var(--border-subtle)] py-3 text-center text-[9px] text-[#4CAF86] tracking-widest uppercase">
                  Commission settled
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mark paid sheet */}
      {paying && (
        <div
          className="fixed inset-0 z-[60] flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.75)" }}
        >
          <div className="bg-[var(--surface)] border-t border-[var(--border-subtle)] rounded-t-xl p-6 max-h-[92dvh] overflow-y-auto animate-sheet-up flex flex-col gap-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display font-700 tracking-wider uppercase text-sm text-[var(--text)]">
                  Mark Commission Paid
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-1">
                  {paying.name}
                </div>
              </div>
              <button
                className="text-[var(--text-muted)] tap-target"
                onClick={() => setPaying(null)}
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <div className="bg-[var(--surface-soft)] border border-[var(--border-subtle)] rounded-sm p-5 text-center">
              <div className="text-[9px] text-[var(--text-subtle)] tracking-widest uppercase mb-2">
                Amount to Pay
              </div>
              <div className="font-display font-800 text-4xl text-[var(--text)]">
                {formatAmount(paying.commission)}
              </div>
            </div>

            <div>
              <div className="text-[9px] text-[var(--text-subtle)] tracking-widest uppercase mb-2">
                Paid via
              </div>
              <div className="flex gap-2">
                {(["cash", "gpay"] as const).map((m) => (
                  <button
                    key={m}
                    className={`flex-1 h-12 font-display font-700 tracking-wider uppercase text-xs tap-target transition-all rounded-sm ${
                      payMode === m
                        ? "bg-[var(--text)] text-[var(--bg)]"
                        : "bg-[var(--elevated)] border border-[var(--border)] text-[var(--text-muted)]"
                    }`}
                    onClick={() => setPayMode(m)}
                  >
                    {m === "gpay" ? "GPay" : "Cash"}
                  </button>
                ))}
              </div>
            </div>

            {payError && (
              <div className="text-xs text-[#E06060] tracking-wide text-center">
                {payError}
              </div>
            )}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setPaying(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                disabled={saving || paying.commission <= 0}
                onClick={() => void markPaid(paying)}
              >
                {saving ? "Saving…" : "Confirm Paid"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ManagerNav active={navTab} onSelect={onNav} />
    </div>
  )
}

function MetricCell({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="p-3 text-center border-r border-[var(--border-subtle)] last:border-r-0">
      <div className="text-[8px] text-[var(--text-faint)] tracking-widest uppercase mb-1">
        {label}
      </div>
      <div
        className={`font-display font-700 text-sm ${
          highlight ? "text-[var(--text)]" : "text-[var(--text-secondary)]"
        }`}
      >
        {value}
      </div>
    </div>
  )
}
