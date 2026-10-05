import { EmptyNote } from "../../components/ui"
import { useState } from "react"
import { StylistNav } from "../../components/layout"
import { SectionLabel } from "../../components/ui"
import { formatAmount } from "../../lib/format"
import { useBranchData } from "../../context/BranchDataContext"
import { staffApi } from "../../lib/api"
import { useAsyncData } from "../../hooks/useAsyncData"
import { mapStylist } from "../../lib/mappers"
import type { Stylist } from "../../types"
import {
  ChevronRight,
  ArrowLeft,
} from "lucide-react"

interface Props {
  stylist: { name: string; id: string }
  onNav: (screen: string) => void
  navTab: string
}

const PERIODS = [
  { label: "Today", value: "TODAY" as const, days: 1, noun: "daily" },
  { label: "Week", value: "THIS_WEEK" as const, days: 7, noun: "weekly" },
  { label: "Month", value: "THIS_MONTH" as const, days: 30, noun: "monthly" },
]

export default function Performance({ onNav, navTab }: Props) {
  const { stylists: todayStylists } = useBranchData()
  const [periodIndex, setPeriodIndex] = useState(0)
  const period = PERIODS[periodIndex]
  // Today comes from the live branch data; week / month are fetched on demand.
  const periodStats = useAsyncData(
    () =>
      period.value === "TODAY"
        ? Promise.resolve(undefined)
        : staffApi.getStats(period.value),
    [period.value],
  )
  const stylists =
    period.value === "TODAY"
      ? todayStylists
      : (periodStats.data ?? []).map(mapStylist)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = stylists.find((stylist) => stylist.id === selectedId)

  return (
    <div className="flex flex-col h-full bg-[var(--bg)]">
      <div className="flex-1 overflow-y-auto pb-nav">
        <div className="px-5 pt-page pb-5 border-b border-[var(--border-subtle)]">
          {selected ? (
            <button
              className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)] mb-3"
              onClick={() => setSelectedId(null)}
            >
              <ArrowLeft size={13} /> All stylists
            </button>
          ) : (
            <div className="text-[10px] tracking-[0.25em] uppercase text-[var(--text-subtle)]">
              {period.label} · Branch performance
            </div>
          )}
          <div className="font-display font-800 leading-none text-[var(--text)] mt-1 text-3xl">
            {selected ? selected.name.toUpperCase() : "MY PERFORMANCE"}
          </div>
          <div className="flex gap-2 mt-4">
            {PERIODS.map((item, index) => (
              <button
                key={item.label}
                className={`px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase border ${
                  index === periodIndex
                    ? "border-[var(--text)] text-[var(--text)]"
                    : "border-[var(--border-subtle)] text-[var(--text-muted)]"
                }`}
                onClick={() => setPeriodIndex(index)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {!selected ? (
          <div className="px-5 py-5">
            <SectionLabel>Tap a stylist to see full stats</SectionLabel>
            <div className="flex flex-col gap-3">
              {periodStats.loading && period.value !== "TODAY" && (
                <EmptyNote>Loading…</EmptyNote>
              )}
              {stylists.length === 0 && !periodStats.loading && (
                <EmptyNote>No stylists to show for this period yet.</EmptyNote>
              )}
              {stylists.map((stylist, index) => {
                const target = (stylist.dailyTarget ?? 0) * period.days
                const progress = Math.min(
                  100,
                  target ? Math.round((stylist.revenueToday / target) * 100) : 0,
                )
                return (
                  <button
                    key={stylist.id}
                    className="w-full bg-[var(--surface)] border border-[var(--border-subtle)] p-4 text-left card-press"
                    onClick={() => setSelectedId(stylist.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-display font-800 text-xl tracking-wider uppercase text-[var(--text)]">
                          {stylist.name}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-1">
                          {stylist.completedToday} customers ·{" "}
                          {formatAmount(stylist.revenueToday)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[8px] tracking-wider uppercase text-[var(--text-muted)]">
                          Commission
                        </div>
                        <div className="font-display font-700 text-[var(--text)]">
                          {formatAmount(stylist.commission)}
                        </div>
                      </div>
                    </div>
                    <div className="h-1 bg-[var(--elevated)] mt-4 overflow-hidden">
                      <div
                        className="h-full bg-[var(--text)]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-[9px] text-[var(--text-muted)]">
                        {progress}% of {period.noun} target
                      </div>
                      <ChevronRight
                        size={14}
                        className="text-[var(--text-faint)]"
                      />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <StylistMetrics stylist={selected} period={period} />
        )}
      </div>

      <StylistNav active={navTab} onSelect={onNav} />
    </div>
  )
}

function StylistMetrics({
  stylist,
  period,
}: {
  stylist: Stylist
  period: (typeof PERIODS)[number]
}) {
  const { stylists, branchName } = useBranchData()
  const target = (stylist.dailyTarget ?? 0) * period.days
  const averageTicket = Math.round(
    stylist.revenueToday / Math.max(stylist.completedToday, 1),
  )
  const services = (stylist.services ?? []).slice(0, 6)

  return (
    <div className="px-5 py-5 flex flex-col gap-5">
      <div className="bg-[var(--surface)] border border-[var(--border)] p-5 text-center">
        <div className="text-[9px] tracking-[0.3em] uppercase text-[var(--text-muted)]">
          Top performer today
        </div>
        <div className="font-display font-800 text-4xl tracking-wider text-[var(--text)] mt-2">
          {stylist.name.toUpperCase()}
        </div>
        <div className="text-xs text-[var(--text-muted)] mt-1">
          {branchName} · daily rank #{stylists.indexOf(stylist) + 1}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <BigStat label="Revenue" value={formatAmount(stylist.revenueToday)} />
        <BigStat label="Customers" value={String(stylist.completedToday)} />
        <BigStat label="Avg ticket" value={formatAmount(averageTicket)} />
        <BigStat label="Commission" value={formatAmount(stylist.commission)} />
        <BigStat label="Tips" value={formatAmount(stylist.tips)} />
        <BigStat
          label="Take home"
          value={formatAmount(stylist.commission + stylist.tips)}
        />
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border-subtle)] p-4">
        <SectionLabel>
          {period.noun[0].toUpperCase() + period.noun.slice(1)} target
        </SectionLabel>
        <div className="flex justify-between text-xs text-[var(--text-secondary)]">
          <span>
            {formatAmount(stylist.revenueToday)} of {formatAmount(target)}
          </span>
          <span>
            {stylist.revenueToday >= target
              ? "Target hit"
              : `${formatAmount(target - stylist.revenueToday)} to go`}
          </span>
        </div>
        <div className="h-1 bg-[var(--elevated)] mt-3">
          <div
            className="h-full bg-[var(--text)]"
            style={{
              width: `${target ? Math.min(100, (stylist.revenueToday / target) * 100) : 0}%`,
            }}
          />
        </div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border-subtle)] p-4">
        <SectionLabel>
          Services {period.value === "TODAY" ? "today" : period.value === "THIS_WEEK" ? "this week" : "this month"}
        </SectionLabel>
        {services.length === 0 && (
          <div className="py-3 text-xs text-[var(--text-muted)]">
            No services billed yet.
          </div>
        )}
        {services.map((service) => (
          <div
            key={service.name}
            className="flex justify-between py-3 border-b border-[var(--border-subtle)] last:border-0"
          >
            <span className="text-sm text-[var(--text-secondary)]">
              {service.name}
            </span>
            <span className="font-display font-700 text-[var(--text)]">
              {service.count}×
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BigStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border-subtle)] p-4">
      <div className="text-[9px] tracking-widest uppercase text-[var(--text-muted)] mb-1">
        {label}
      </div>
      <div className="font-display font-800 text-xl text-[var(--text)]">
        {value}
      </div>
    </div>
  )
}
