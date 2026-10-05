import { EmptyNote } from "../../../components/ui"
import {
  Activity,
  ArrowRight,
  BadgeIndianRupee,
  CreditCard,
  Users,
} from "lucide-react"
import { useState } from "react"
import { adminApi } from "../../../lib/api"
import { useAsyncData } from "../../../hooks/useAsyncData"
import { formatMoney } from "../adminTypes"
import type { DateRange } from "../components"
import { AdminPage, AsyncNotice, BranchPulseCard, DateRangePicker, PageHeading, AdminCard, CardHeader, MetricCard, CompactMetric, PeriodTabs } from "../components"
import type { Period } from "../types"
import { PERIOD_TO_REPORT } from "../types"

/** Branch cards shown on the overview; the rest live on the full "Branch pulse" page. */
const PULSE_PREVIEW = 3

export function Overview({
  period,
  onPeriod,
  onBranch,
  onViewAllBranches,
  adminName,
}: {
  period: Period
  onPeriod: (period: Period) => void
  onBranch: (id: string, name: string) => void
  onViewAllBranches: () => void
  adminName: string
}) {
  const [range, setRange] = useState<DateRange>({})
  const custom = period === "Custom"
  const rangeReady = !custom || (!!range.from && !!range.to)
  const { data, loading, error, reload } = useAsyncData(
    () =>
      rangeReady
        ? adminApi.getOverview({
            period: PERIOD_TO_REPORT[period],
            ...(custom ? { from: range.from, to: range.to } : {}),
          })
        : Promise.resolve(undefined),
    [period, range.from, range.to],
  )
  const branches = data?.branches ?? []
  const weeklyRevenue = data?.weekly ?? []
  const topServices = data?.topServices ?? []
  const totals = data?.totals
  const payroll = data?.payroll
  return (
    <AdminPage>
      <PageHeading
        eyebrow={branches.length ? `Live across ${branches.length} ${branches.length === 1 ? "branch" : "branches"}` : "Live across all branches"}
        title={
          <>
            Good day,
            <br className="sm:hidden" /> {adminName}
          </>
        }
        description="Revenue, customers and branch activity for the selected period."
      />
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <PeriodTabs value={period} onChange={onPeriod} custom />
        {custom && <DateRangePicker value={range} onChange={setRange} autoOpen={!range.from} />}
      </div>
      {custom && !rangeReady && (
        <div className="rounded-xl border border-dashed border-[var(--border)] px-5 py-8 text-center text-xs text-[var(--text-muted)]">
          Choose a start and end date to see revenue for that range.
        </div>
      )}
      <AsyncNotice loading={loading && !data} error={error} onRetry={reload} />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <MetricCard
          icon={<BadgeIndianRupee size={18} />}
          label="Total revenue"
          value={formatMoney(totals?.revenue ?? 0)}
          detail="All branches"
        />
        <MetricCard
          icon={<Users size={18} />}
          label="Customers"
          value={String(totals?.customers ?? 0)}
          detail="Completed sessions"
        />
        <MetricCard
          icon={<CreditCard size={18} />}
          label="Avg ticket"
          value={formatMoney(totals?.avgTicket ?? 0)}
          detail="Per customer"
        />
        <MetricCard
          icon={<Activity size={18} />}
          label="Active now"
          value={String(totals?.activeNow ?? 0)}
          detail="In chair right now"
        />
      </div>

      <AdminCard className="p-4 sm:p-5">
        <CardHeader title="Payroll overview" meta={payroll?.month ?? ""} />
        <div className="grid sm:grid-cols-3 gap-3 mt-4">
          <CompactMetric label="Total salary bill" value={formatMoney(payroll?.salaryBill ?? 0)} />
          <CompactMetric label="Advances this month" value={formatMoney(payroll?.advances ?? 0)} tone="danger" />
          <CompactMetric label="Net payable" value={formatMoney(payroll?.netPayable ?? 0)} tone="success" />
        </div>
      </AdminCard>

      <section>
        <CardHeader title="Branch pulse" meta="Tap any branch for full details" />
        {data && branches.length === 0 && (
          <EmptyNote className="mt-4">No active branches yet.</EmptyNote>
        )}
        <div className="grid md:grid-cols-3 gap-3 mt-4">
          {branches.slice(0, PULSE_PREVIEW).map((branch) => (
            <BranchPulseCard key={branch.id} branch={branch} onOpen={onBranch} />
          ))}
        </div>
        {branches.length > PULSE_PREVIEW && (
          <div className="mt-4 flex justify-center">
            <button
              className="admin-secondary-button h-11 min-w-[16rem] whitespace-nowrap px-6 text-[0.7rem] tracking-wider"
              onClick={onViewAllBranches}
            >
              View all branches <ArrowRight size={14} />
            </button>
          </div>
        )}
      </section>

      <div className="grid xl:grid-cols-[1.35fr_1fr] gap-3">
        <AdminCard className="p-5">
          <CardHeader title="Weekly revenue" meta="Monday — Sunday" />
          {weeklyRevenue.every((day) => !day.value) && (
            <EmptyNote className="mt-5">No revenue recorded this week yet.</EmptyNote>
          )}
          <div
            className={`h-52 flex items-end gap-2 sm:gap-3 mt-6 ${
              weeklyRevenue.every((day) => !day.value) ? "opacity-40" : ""
            }`}
          >
            {weeklyRevenue.map((item) => {
              const max = Math.max(1, ...weeklyRevenue.map((day) => day.value))
              return (
                <div key={item.day} className="flex-1 h-full flex flex-col justify-end">
                  <div className="text-[9px] text-center text-[var(--text-muted)] mb-2">
                    {item.value >= 1000 ? `₹${item.value / 1000}k` : `₹${item.value}`}
                  </div>
                  <div
                    className="w-full bg-[var(--text)] opacity-75 rounded-t-lg min-h-1"
                    style={{ height: `${Math.max(3, (item.value / max) * 100)}%` }}
                  />
                  <div className="text-[9px] text-center text-[var(--text-muted)] mt-2">
                    {item.day}
                  </div>
                </div>
              )
            })}
          </div>
        </AdminCard>
        <AdminCard className="p-5">
          <CardHeader title="Top services" meta="By completed bookings" />
          <div className="mt-3">
            {topServices.length === 0 && (
              <div className="py-6 text-center text-xs text-[var(--text-muted)]">
                No completed sessions in this period.
              </div>
            )}
            {topServices.map((service, index) => (
              <div
                key={service.name}
                className="grid grid-cols-[1.5rem_1fr_auto] gap-2 py-3 border-b border-[var(--border-subtle)] last:border-0"
              >
                <span className="font-display font-700 text-[var(--text-muted)]">
                  {index + 1}
                </span>
                <span className="text-xs leading-relaxed">{service.name}</span>
                <span className="font-display font-700">{service.count}</span>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>
    </AdminPage>
  )
}
