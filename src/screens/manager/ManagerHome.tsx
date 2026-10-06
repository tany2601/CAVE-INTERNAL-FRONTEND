import { EmptyNote, Podium, SectionLabel } from "../../components/ui"
import { PACE_CLASS, PACE_LABEL, paceOf } from "../../lib/pace"
import { ManagerNav } from "../../components/layout"
import { formatAmount, formatDuration } from "../../lib/format"
import { useBranchData } from "../../context/BranchDataContext"
import { Session, Stylist } from "../../types"
import {
  Clock,
  ArrowRight,
  LogOut,
  Sun,
  Moon,
  ArrowLeft,
} from "lucide-react"

interface Props {
  onNav: (screen: string) => void
  navTab: string
  onCloseSession: (session: Session) => void
  openingBalanceDone: boolean
  onAddOpeningBalance: () => void
  onLogout: () => void
  /** Back to the customer check-in screen without signing out. */
  onGoBack: () => void
  theme: "dark" | "light"
  onThemeToggle: () => void
}

export default function ManagerHome({
  onNav,
  navTab,
  onCloseSession,
  openingBalanceDone,
  onAddOpeningBalance,
  onLogout,
  onGoBack,
  theme,
  onThemeToggle,
}: Props) {
  const {
    stylists,
    activeSessions,
    closedSessions,
    expenses,
    payouts,
    getStylist,
    branchShort,
  } = useBranchData()
  const productSales = closedSessions.reduce(
    (a, s) => a + (s.products ?? []).reduce((b, p) => b + p.price * p.qty, 0),
    0,
  )
  const tipWithdrawals = payouts
    .filter((p) => p.kind === "TIP_WITHDRAWAL")
    .reduce((a, p) => a + p.amount, 0)
  const totalRevenue = closedSessions.reduce((a, s) => a + (s.total || 0), 0)
  const cashRevenue = closedSessions
    .filter((s) => s.paymentMode === "cash")
    .reduce((a, s) => a + (s.total || 0), 0)
  const gpayRevenue = closedSessions
    .filter((s) => s.paymentMode === "gpay")
    .reduce((a, s) => a + (s.total || 0), 0)
  const totalCommission = stylists.reduce((a, s) => a + s.commission, 0)
  const totalExpenses = expenses.reduce((a, e) => a + e.amount, 0)
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening"

  return (
    <div className="flex flex-col h-full bg-[var(--bg)]">
      <div className="flex-1 overflow-y-auto pb-nav">
        {/* Header */}
        <div className="px-5 pt-page pb-5 border-b border-[var(--border-subtle)]">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] tracking-[0.25em] uppercase text-[var(--text-subtle)]">
                {greeting} · Manager
              </div>
              <div className="font-display font-800 leading-none text-[var(--text)] mt-1 text-3xl tracking-wide">
                CAVE {branchShort.toUpperCase()}
              </div>
              <div className="text-[10px] text-[var(--text-faint)] tracking-[0.15em] uppercase mt-1">
                {now.toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-1">
              <button
                aria-label="Toggle theme"
                className="w-9 h-9 flex items-center justify-center border border-[var(--border-subtle)] text-[var(--text-muted)]"
                onClick={onThemeToggle}
              >
                {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              </button>
              <button
                aria-label="Log out"
                className="w-9 h-9 flex items-center justify-center border border-[var(--border-subtle)] text-[var(--text-muted)]"
                onClick={onLogout}
              >
                <LogOut size={15} />
              </button>
              </div>
              <button
                className="h-7 px-3 flex items-center gap-1.5 border border-[var(--border-subtle)] text-[9px] tracking-[0.2em] uppercase text-[var(--text-muted)] tap-target"
                onClick={onGoBack}
              >
                <ArrowLeft size={11} /> Go back
              </button>
            </div>
          </div>
        </div>

        {/* Opening balance reminder */}
        {!openingBalanceDone && (
          <button
            className="mx-5 mt-4 w-[calc(100%-40px)] bg-[var(--surface)] border border-[rgba(128,128,128,0.3)] rounded-sm p-4 flex items-center justify-between animate-fade-in tap-target card-press text-left"
            onClick={onAddOpeningBalance}
          >
            <div>
              <div className="text-[11px] font-semibold text-[var(--text-secondary)] tracking-wider mb-0.5">
                Opening balance pending
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                Add today's cash and GPay opening.
              </div>
            </div>
            <ArrowRight
              size={14}
              className="text-[var(--text-secondary)] flex-shrink-0 ml-3"
              strokeWidth={1.5}
            />
          </button>
        )}

        {/* Revenue grid */}
        <div className="px-5 py-5">
          <SectionLabel>Today at a Glance</SectionLabel>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <RevenueCard
              label="Total Revenue"
              value={formatAmount(totalRevenue)}
              large
            />
            <RevenueCard
              label="Customers"
              value={String(closedSessions.length + activeSessions.length)}
              large
            />
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <RevenueCard label="Product sales" value={formatAmount(productSales)} />
            <RevenueCard label="Tip withdrawals" value={formatAmount(tipWithdrawals)} />
          </div>
          <div className="grid grid-cols-4 gap-2">
            <SmallStat label="Cash" value={formatAmount(cashRevenue)} />
            <SmallStat label="GPay" value={formatAmount(gpayRevenue)} />
            <SmallStat
              label="Commission"
              value={formatAmount(totalCommission)}
            />
            <SmallStat
              label="Net"
              value={formatAmount(totalRevenue - totalCommission - totalExpenses)}
            />
          </div>
        </div>

        {/* Active sessions */}
        <div className="px-5 pb-5">
          <SectionLabel>Active Now ({activeSessions.length})</SectionLabel>
          <div className="flex flex-col gap-2.5">
            {activeSessions.length === 0 && (
              <EmptyNote>No active sessions right now.</EmptyNote>
            )}
            {activeSessions.map((session) => {
              const stylist = getStylist(session.stylistId)
              return (
                <div
                  key={session.id}
                  className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-sm overflow-hidden"
                  style={{ borderRadius: "4px" }}
                >
                  <div className="flex items-center justify-between p-4 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-[var(--elevated)] border border-[var(--border)] flex items-center justify-center font-display font-700 text-xs text-[var(--text-secondary)]">
                          {session.customerName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#2E7D58] border border-[var(--surface)]" />
                      </div>
                      <div>
                        <div className="font-display font-700 tracking-wide text-sm text-[var(--text)]">
                          {session.customerName}
                        </div>
                        <div className="text-[10px] text-[var(--text-subtle)]">
                          {stylist ? `with ${stylist.name}` : "No stylist assigned"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-[var(--elevated)] border border-[var(--border)] px-2 py-1 rounded-full">
                      <Clock size={9} className="text-[var(--text-muted)]" />
                      <span className="text-[9px] text-[var(--text-secondary)]">
                        {formatDuration(session.startTime)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center border-t border-[var(--border-subtle)]">
                    <div className="flex-1 min-w-0 px-4 py-2.5 flex gap-1.5 flex-wrap">
                      {session.services.map((s) => (
                        <span
                          key={s.id}
                          className="text-[9px] bg-[var(--elevated)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-full text-[var(--text-muted)]"
                        >
                          {s.name}
                        </span>
                      ))}
                    </div>
                    <button
                      className="shrink-0 self-stretch px-4 py-2.5 border-l border-[var(--border-subtle)] text-[10px] tracking-[0.15em] uppercase text-[var(--text-secondary)] tap-target active:bg-[var(--text)] active:text-[var(--bg)] transition-all font-display font-700"
                      onClick={() => onCloseSession(session)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Staff status */}
        <div className="px-5 pb-5">
          <SectionLabel>Staff Status</SectionLabel>
          <div className="flex flex-col gap-0">
            {stylists.length === 0 && (
              <EmptyNote>No staff have been added to this branch yet.</EmptyNote>
            )}
            {stylists.map((s, i) => (
              <div
                key={s.id}
                className={`flex items-center gap-3 py-3.5 ${
                  i < stylists.length - 1
                    ? "border-b border-[var(--border-subtle)]"
                    : ""
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 rounded-full bg-[var(--elevated)] border border-[var(--border)] flex items-center justify-center font-display font-700 text-xs text-[var(--text-secondary)]">
                    {s.name.slice(0, 2).toUpperCase()}
                  </div>
                  {s.available && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#2E7D58] border border-[var(--bg)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-700 tracking-wider uppercase text-sm text-[var(--text)]">
                    {s.name}
                  </div>
                  <div className="text-[10px] text-[var(--text-subtle)] mt-0.5">
                    {s.activeSessions} active · {s.completedToday} done today
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display font-700 text-sm text-[var(--text)]">
                    {formatAmount(s.revenueToday)}
                  </div>
                  <PaceBadge stylist={s} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top performers */}
        {stylists.some((s) => s.revenueToday > 0) && (
          <div className="px-5 pb-5">
            <SectionLabel>Top Performers Today</SectionLabel>
            <Podium
              entries={stylists.map((s) => ({
                id: s.id,
                name: s.name,
                value: s.revenueToday,
                detail: `${s.completedToday} customer${s.completedToday === 1 ? "" : "s"}`,
              }))}
            />
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <ManagerNav active={navTab} onSelect={onNav} />
    </div>
  )
}

function RevenueCard({
  label,
  value,
  large,
}: {
  label: string
  value: string
  large?: boolean
}) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-sm p-4 flex flex-col gap-1">
      <div className="text-[9px] tracking-widest uppercase text-[var(--text-subtle)]">
        {label}
      </div>
      <div
        className={`font-display font-800 text-[var(--text)] leading-none ${
          large ? "text-2xl" : "text-lg"
        }`}
      >
        {value}
      </div>
    </div>
  )
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-sm p-2.5 flex flex-col gap-1 text-center">
      <div className="font-display font-700 text-sm text-[var(--text)] leading-none">
        {value}
      </div>
      <div className="text-[8px] tracking-wider uppercase text-[var(--text-faint)]">
        {label}
      </div>
    </div>
  )
}

/** Below / On track / Good, from today's revenue against where the daily target says they should be by now. */
function PaceBadge({ stylist }: { stylist: Stylist }) {
  const { status, percent } = paceOf(stylist)
  return (
    <span
      title={`${percent}% of expected pace`}
      className={`mt-1 inline-flex min-w-[4.5rem] items-center justify-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-widest ${PACE_CLASS[status]}`}
    >
      {PACE_LABEL[status]}
    </span>
  )
}
