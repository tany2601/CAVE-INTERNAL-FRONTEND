import {
  ArrowLeft,
  BadgeIndianRupee,
} from "lucide-react"
import { adminApi } from "../../../lib/api"
import { useAsyncData } from "../../../hooks/useAsyncData"
import type { BranchSummaryReport } from "../../../types/api"
import { formatMoney } from "../adminTypes"
import { AdminCard, AsyncNotice, PeriodTabs, DataTable } from "../components"
import type { Period, BranchTab } from "../types"
import { PERIOD_TO_REPORT } from "../types"

export function BranchDetail({
  branch,
  tab,
  period,
  onTab,
  onPeriod,
  onBack,
}: {
  branch: { id: string; name: string }
  tab: BranchTab
  period: Period
  onTab: (tab: BranchTab) => void
  onPeriod: (period: Period) => void
  onBack: () => void
}) {
  const reportPeriod = PERIOD_TO_REPORT[period]
  const summary = useAsyncData(
    () => adminApi.getBranchSummary(branch.id, reportPeriod),
    [branch.id, reportPeriod],
  )
  const sessionsState = useAsyncData(
    () =>
      tab === "sessions"
        ? adminApi.getSessionsReport({ branchId: branch.id, period: reportPeriod, limit: 50 })
        : Promise.resolve(undefined),
    [branch.id, reportPeriod, tab],
  )
  const staffState = useAsyncData(
    () =>
      tab === "staff"
        ? adminApi.getEmployeesReport({ branchId: branch.id, period: reportPeriod })
        : Promise.resolve(undefined),
    [branch.id, reportPeriod, tab],
  )
  const sessions = sessionsState.data?.data ?? []
  const branchStaff = staffState.data ?? []
  const info = summary.data
  const location = info?.branch.location ?? ""
  const active = info?.activeNow ?? 0
  return (
    <div className="branch-detail-page admin-photo-page min-h-full">
      <section className="branch-detail-hero">
        <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-9 relative z-10">
          <button className="admin-back-button" onClick={onBack}>
            <ArrowLeft size={14} /> All branches
          </button>
          <div className="grid lg:grid-cols-[1fr_auto] gap-7 items-end mt-8">
            <div>
              <div className="text-[9px] tracking-[0.3em] uppercase text-white/55">
                {location} · Branch command center
              </div>
              <div className="font-display font-800 text-5xl sm:text-7xl tracking-[0.08em] uppercase text-white mt-2 leading-none">
                {branch.name}
              </div>
              <div className="flex items-center gap-2 text-xs text-white/65 mt-4">
                <span className="w-2 h-2 rounded-full bg-[#4CAF86]" />
                Branch operating normally · {active} active now
              </div>
            </div>
            <div
              className="branch-target-dial"
              style={{ "--progress": `${Math.min(100, info?.targetPercent ?? 0)}%` } as React.CSSProperties}
            >
              <div>
                <strong>{info?.targetPercent ?? 0}%</strong>
                <span>Monthly target</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
        <div className="branch-detail-toolbar">
          <div className="admin-segment">
            {(["summary", "sessions", "staff"] as BranchTab[]).map((item) => (
              <button
                key={item}
                className={tab === item ? "active" : ""}
                onClick={() => onTab(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <PeriodTabs
            value={period}
            onChange={onPeriod}
            options={["Today", "This Week", "This Month"]}
          />
        </div>

        <AsyncNotice
          loading={summary.loading && !summary.data}
          error={summary.error}
          onRetry={summary.reload}
        />
        <div className="mt-5">
          {tab === "summary" && info && <BranchSummary summary={info} />}
      {tab === "sessions" && (
        <AdminCard className="overflow-hidden">
          <DataTable
            columns={["Date", "Customer", "Stylist", "Services", "Amount", "Mode", "Tip", "Duration", "Status"]}
            rows={sessions.map((session) => [
              session.closedAt
                ? new Date(session.closedAt).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—",
              session.customer,
              session.stylist,
              session.services,
              formatMoney(session.amount),
              session.mode,
              session.tip ? formatMoney(session.tip) : "—",
              `${session.durationMin}m`,
              session.status,
            ])}
            empty="No sessions for this period."
          />
        </AdminCard>
      )}
      {tab === "staff" && (
        <AdminCard className="overflow-hidden">
          <DataTable
            columns={["Name", "Revenue", "Customers", "Commission", "Time", "Status"]}
            rows={branchStaff.map((staff) => [
              staff.name,
              formatMoney(staff.revenue),
              String(staff.customers),
              formatMoney(staff.commission),
              staff.time,
              staff.revenue > 0 ? "On track" : "Below",
            ])}
            empty="No staff assigned to this branch."
          />
        </AdminCard>
      )}
        </div>
      </div>
    </div>
  )
}

function BranchSummary({ summary }: { summary: BranchSummaryReport }) {
  const f = summary.finance
  const metrics = [
    ["Service revenue", formatMoney(f.serviceRevenue)],
    ["Customers", String(f.customers)],
    ["Cash collection", formatMoney(f.cashCollected)],
    ["GPay collection", formatMoney(f.gpayCollected)],
    ["Product sales (cash)", formatMoney(f.productSalesCash)],
    ["Product sales (GPay)", formatMoney(f.productSalesGpay)],
    ["Expenses (cash)", formatMoney(f.expensesCash)],
    ["Expenses (GPay)", formatMoney(f.expensesGpay)],
    ["Commission paid", formatMoney(f.commissionPaid)],
    ["Tip withdrawals", formatMoney(f.tipWithdrawals)],
    ["Net in hand", formatMoney(f.netInHand)],
  ]
  return (
    <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-4">
      <section className="branch-finance-board">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="admin-kicker">Daily reconciliation</div>
            <div className="font-display font-800 text-3xl mt-1">
              {formatMoney(f.serviceRevenue)}
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-1">
              Service revenue
            </div>
          </div>
          <BadgeIndianRupee size={24} className="text-[var(--text-muted)]" />
        </div>
        <div className="branch-finance-flow mt-7">
          {metrics.slice(2, 10).map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </section>
      <aside className="branch-net-panel">
        <div className="admin-kicker">Net in hand</div>
        <div className="font-display font-800 text-5xl mt-4">
          {metrics[10][1]}
        </div>
        <div className="text-xs text-[var(--text-muted)] mt-2">
          After expenses, commission and withdrawals
        </div>
        <div className="border-t border-[var(--border)] mt-7 pt-5 flex justify-between">
          <span className="text-xs">Customers served</span>
          <strong className="font-display text-xl">{f.customers}</strong>
        </div>
      </aside>
    </div>
  )
}
