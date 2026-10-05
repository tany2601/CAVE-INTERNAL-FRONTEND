import { Button, Logo } from "../../components/ui"
import { Session } from "../../types"
import { formatAmount } from "../../lib/format"
import { useBranchData } from "../../context/BranchDataContext"
import { CheckCircle } from "lucide-react"

interface Props {
  session: Session
  total: number
  paymentMode: "cash" | "gpay"
  onDone: () => void
}

export default function SessionSuccess({
  session,
  total,
  paymentMode,
  onDone,
}: Props) {
  const { getStylist } = useBranchData()
  const stylist = getStylist(session.stylistId)

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg)] flex flex-col items-center px-6 py-8 gap-8 overflow-y-auto animate-fade-in [&>*:first-child]:mt-auto [&>*:last-child]:mb-auto">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-[rgba(46,125,88,0.1)] border border-[rgba(46,125,88,0.2)] flex items-center justify-center">
          <CheckCircle size={28} className="text-[#4CAF86]" strokeWidth={1.5} />
        </div>
        <div className="font-display font-800 tracking-wider uppercase text-xl text-[var(--text)]">
          Session Completed
        </div>
      </div>

      <div className="w-full bg-[var(--surface)] border border-[var(--border-subtle)] rounded-sm p-5 flex flex-col gap-3">
        <Row label="Customer" value={session.customerName} />
        <Row label="Stylist" value={stylist?.name || "—"} />
        <Row
          label="Services"
          value={session.services?.map((s) => s.name).join(", ") || "—"}
        />
        <div className="border-t border-[var(--border-subtle)] pt-3">
          <Row label="Total" value={formatAmount(total)} bold />
          <Row
            label="Payment"
            value={paymentMode === "gpay" ? "GPay" : "Cash"}
          />
        </div>
      </div>

      {session.customerPhone && (
        <div className="text-center text-[11px] text-[#4CAF86] tracking-wide animate-fade-in">
          Bill sent to {session.customerPhone} via WhatsApp
        </div>
      )}

      <Button variant="primary" fullWidth size="lg" onClick={onDone}>
        Done
      </Button>
    </div>
  )
}

function Row({
  label,
  value,
  bold,
}: {
  label: string
  value: string
  bold?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">
        {label}
      </span>
      <span
        className={`text-sm ${
          bold
            ? "font-display font-700 text-[var(--text)]"
            : "text-[var(--text-secondary)]"
        }`}
      >
        {value}
      </span>
    </div>
  )
}
