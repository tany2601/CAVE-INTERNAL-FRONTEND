import { useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  CalendarRange,
  X,
} from "lucide-react"
import { adminApi } from "../../../lib/api"
import { useAsyncData } from "../../../hooks/useAsyncData"
import { useAdminBranches } from "../../../hooks/useAdminBranches"
import { formatMoney } from "../adminTypes"
import { AdminPage, AsyncNotice, PageHeading, AdminCard, CardHeader, CompactMetric, AdminSelect, DataTable } from "../components"

export function MonthlyView() {
  const now = new Date()
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [year, setYear] = useState(String(now.getFullYear()))
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [branch, setBranch] = useState("All Branches")
  const branchList = useAdminBranches()
  const { data, loading, error, reload } = useAsyncData(
    () =>
      adminApi.getMonthlyReport({
        branchId: branchList.idOf(branch),
        year: Number(year),
        month,
      }),
    [branch, year, month, branchList.branches.length],
  )
  // Five years back through next year, always including the year being viewed.
  const thisYear = now.getFullYear()
  const yearOptions = Array.from(
    new Set([...Array.from({ length: 7 }, (_, i) => String(thisYear - 5 + i)), year]),
  ).sort()
  const monthName = data?.monthLabel.split(" ")[0] ?? ""
  const days = data?.days ?? []
  const day = selectedDay ? days.find((d) => d.day === selectedDay) : undefined
  const shiftMonth = (delta: number) => {
    const next = month + delta
    if (next < 1) {
      setMonth(12)
      setYear(String(Number(year) - 1))
    } else if (next > 12) {
      setMonth(1)
      setYear(String(Number(year) + 1))
    } else {
      setMonth(next)
    }
    setSelectedDay(null)
  }
  const moneyRow = (r: NonNullable<typeof data>["total"]) => [
    r.name,
    formatMoney(r.serviceRevenue),
    formatMoney(r.products),
    formatMoney(r.cash),
    formatMoney(r.gpay),
    formatMoney(r.commission),
    formatMoney(r.expenses),
    formatMoney(r.advances),
    formatMoney(r.tipWithdrawals),
    formatMoney(r.net),
  ]
  return (
    <AdminPage>
      <PageHeading
        eyebrow={`${monthName} ${year}`}
        title="Monthly tracker"
        description="Daily and monthly revenue, expenses and net cash for each branch."
      />
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <AdminSelect value={branch} onChange={setBranch} options={branchList.options} />
        <AdminSelect
          value={year}
          onChange={setYear}
          options={yearOptions}
          leading={<CalendarRange size={15} />}
          className="sm:!w-36"
        />
        <div className="flex items-center gap-2">
          <button className="admin-icon-button" aria-label="Previous month" onClick={() => shiftMonth(-1)}>
            <ArrowLeft size={15} />
          </button>
          <div className="font-display font-800 text-xl tracking-widest uppercase">
            {monthName} {year}
          </div>
          <button className="admin-icon-button" aria-label="Next month" onClick={() => shiftMonth(1)}>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
      <AsyncNotice loading={loading && !data} error={error} onRetry={reload} />
      <AdminCard className="overflow-hidden">
        <CardHeader
          className="p-5 pb-0"
          title="Branch summary"
          meta={`${monthName} ${year}`}
        />
        <DataTable
          columns={["Branch", "Svc rev", "Products", "Cash", "GPay", "Commission", "Expenses", "Advances", "Tip withdrawals", "Net"]}
          rows={data ? [...data.branches.map(moneyRow), moneyRow(data.total)] : []}
        />
      </AdminCard>
      <AdminCard className="p-4 sm:p-5">
        <CardHeader
          title="Calendar"
          meta={`${monthName} ${year} · tap a revenue day`}
        />
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mt-5">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-[8px] sm:text-[9px] uppercase tracking-wider text-[var(--text-muted)] py-2">
              {day}
            </div>
          ))}
          {Array.from({ length: data?.firstWeekday ?? 0 }).map((_, index) => (
            <div key={`blank-${index}`} />
          ))}
          {days.map((item) => {
            const revenue = item.revenue
            const day = item.day
            return (
              <button
                key={day}
                className={`aspect-square min-h-11 rounded-lg border flex flex-col items-center justify-center ${
                  revenue
                    ? "border-[var(--text-muted)] bg-[var(--elevated)]"
                    : "border-[var(--border-subtle)] bg-[var(--surface)]"
                } ${item.date === data?.today ? "ring-1 ring-[#4CAF86]" : ""}`}
                onClick={() => revenue && setSelectedDay(day)}
              >
                <span className="font-display font-700">{day}</span>
                {revenue > 0 && (
                  <span className="hidden sm:block text-[8px] text-[var(--text-muted)] mt-1">
                    {formatMoney(revenue)}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-4 text-[9px] text-[var(--text-muted)] mt-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--text)]" /> Has revenue
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4CAF86]" /> Today
          </span>
        </div>
      </AdminCard>

      {day && (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5">
          <AdminCard className="w-full sm:max-w-2xl rounded-b-none sm:rounded-b-2xl p-5 sm:p-7 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--text-muted)]">
                  Day reconciliation
                </div>
                <div className="font-display font-800 text-2xl sm:text-3xl tracking-wider uppercase mt-1">
                  {new Date(`${day.date}T00:00:00Z`).toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                </div>
              </div>
              <button className="admin-icon-button" onClick={() => setSelectedDay(null)}>
                <X size={17} />
              </button>
            </div>
            {day.branches.map((b) => (
              <div key={b.branchId}>
                <div className="font-display font-700 tracking-widest uppercase mt-7">
                  {b.name}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <CompactMetric label="Revenue" value={formatMoney(b.revenue)} />
                  <CompactMetric label="Customers" value={String(b.customers)} />
                  <CompactMetric label="Cash" value={formatMoney(b.cash)} />
                  <CompactMetric label="GPay" value={formatMoney(b.gpay)} />
                  <CompactMetric label="Product sales" value={formatMoney(b.products)} />
                  <CompactMetric label="Expenses" value={formatMoney(b.expenses)} tone="danger" />
                  <CompactMetric label="Commission" value={formatMoney(b.commission)} tone="danger" />
                  <CompactMetric label="Net in hand" value={formatMoney(b.netInHand)} tone="success" />
                </div>
              </div>
            ))}
          </AdminCard>
        </div>
      )}
    </AdminPage>
  )
}
