import { formatAmount, formatMinutes } from "../lib/format"
import type { Stylist } from "../types"

const Cell = ({ label, value, tone }: { label: string; value: string; tone?: string }) => (
  <div className="min-w-0 bg-[var(--surface)] border border-[var(--border-subtle)] p-3">
    <div className="truncate text-[8px] tracking-widest uppercase text-[var(--text-muted)]">{label}</div>
    <div className={`mt-1 truncate font-display text-lg font-800 ${tone ?? "text-[var(--text)]"}`}>{value}</div>
  </div>
)

/**
 * Cash vs GPay for revenue and tips, plus time spent with customers. `periodLabel` words the time
 * cells ("today", "this week"…).
 */
export function StylistStats({ stylist, periodLabel }: { stylist: Stylist; periodLabel: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <Cell label="Cash revenue" value={formatAmount(stylist.cashRevenue ?? 0)} />
        <Cell label="GPay revenue" value={formatAmount(stylist.gpayRevenue ?? 0)} />
        <Cell label="Cash tips" value={formatAmount(stylist.cashTips ?? 0)} />
        <Cell label="GPay tips" value={formatAmount(stylist.gpayTips ?? 0)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Cell label={`Work time ${periodLabel}`} value={formatMinutes(stylist.workMinutes ?? 0)} />
        <Cell label="Avg per session" value={formatMinutes(stylist.avgSessionMinutes ?? 0)} />
      </div>
    </div>
  )
}
