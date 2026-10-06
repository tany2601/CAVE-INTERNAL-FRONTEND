import { useState } from "react"
import { StylistNav } from "../../components/layout"
import { SectionLabel } from "../../components/ui"
import { StylistStats } from "../../components/StylistStats"
import { formatDuration, formatAmount, formatMinutes, sessionMinutes } from "../../lib/format"
import { useBranchData } from "../../context/BranchDataContext"
import { Session } from "../../types"
import {
  Clock,
  ChevronRight,
  LogOut,
  Sun,
  Moon,
  ArrowLeft,
} from "lucide-react"

interface Props {
  stylist: { name: string; id: string }
  onCloseSession: (session: Session) => void
  onStartCustomer: () => void
  onNav: (screen: string) => void
  navTab: string
  onLogout: () => void
  /** Back to the customer check-in screen without signing out. */
  onGoBack: () => void
  theme: "dark" | "light"
  onThemeToggle: () => void
}

export default function StylistHome({
  onCloseSession,
  onNav,
  navTab,
  onLogout,
  onGoBack,
  theme,
  onThemeToggle,
}: Props) {
  const { stylists, activeSessions, closedSessions, branchShort } =
    useBranchData()
  const [selectedStylist, setSelectedStylist] = useState<string | null>(null)
  const now = new Date()
  const selected = stylists.find((stylist) => stylist.id === selectedStylist)
  const active = selected
    ? activeSessions.filter((session) => session.stylistId === selected.id)
    : []
  const closed = selected
    ? closedSessions.filter((session) => session.stylistId === selected.id)
    : []
  const totalDone = stylists.reduce(
    (sum, stylist) => sum + stylist.completedToday,
    0,
  )
  const totalRevenue = stylists.reduce(
    (sum, stylist) => sum + stylist.revenueToday,
    0,
  )

  return (
    <div className="flex flex-col h-full bg-[var(--bg)]">
      <div className="flex-1 overflow-y-auto pb-nav">
        <div className="px-5 pt-page pb-5 border-b border-[var(--border-subtle)]">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] tracking-[0.25em] uppercase text-[var(--text-subtle)]">
                {now.toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </div>
              <div className="font-display font-800 tracking-wide text-[var(--text)] mt-1 text-3xl leading-none">
                {selected ? selected.name.toUpperCase() : "HELLO, stylists"}
              </div>
              <div className="text-[10px] text-[var(--text-faint)] tracking-[0.2em] uppercase mt-1">
                CAVE · {branchShort}
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

        {!selected ? (
          <>
            <div className="px-5 py-5">
              <div className="grid grid-cols-3 gap-2">
                <Metric
                  label="Active now"
                  value={String(activeSessions.length)}
                />
                <Metric label="Done today" value={String(totalDone)} />
                <Metric label="Revenue" value={formatAmount(totalRevenue)} />
              </div>
            </div>

            <div className="px-5 pb-5">
              <SectionLabel>Stylist overview</SectionLabel>
              <div className="flex flex-col gap-2">
                {stylists.map((stylist) => (
                  <button
                    key={stylist.id}
                    className="w-full bg-[var(--surface)] border border-[var(--border-subtle)] p-4 flex items-center text-left card-press"
                    onClick={() => setSelectedStylist(stylist.id)}
                  >
                    <div className="w-10 h-10 rounded-full bg-[var(--elevated)] border border-[var(--border)] flex items-center justify-center font-display font-700 text-[var(--text-secondary)]">
                      {stylist.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 ml-3">
                      <div className="font-display font-800 tracking-wider uppercase text-[var(--text)]">
                        {stylist.name}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-1">
                        {stylist.completedToday} done ·{" "}
                        {formatAmount(stylist.revenueToday)}
                      </div>
                    </div>
                    <div className="text-right mr-3">
                      <div className="font-display font-700 text-[var(--text)]">
                        {stylist.activeSessions}
                      </div>
                      <div className="text-[8px] tracking-wider uppercase text-[var(--text-muted)]">
                        Active
                      </div>
                    </div>
                    <ChevronRight
                      size={15}
                      className="text-[var(--text-faint)]"
                    />
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="px-5 py-5">
            <button
              className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)] mb-6"
              onClick={() => setSelectedStylist(null)}
            >
              <ArrowLeft size={13} /> All stylists
            </button>
            <SectionLabel>Today's stats</SectionLabel>
            <div className="mb-7">
              <StylistStats stylist={selected} periodLabel="today" />
            </div>
            <SectionLabel>Active ({active.length})</SectionLabel>
            <div className="flex flex-col gap-2 mb-7">
              {active.length ? (
                active.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onClose={() => onCloseSession(session)}
                  />
                ))
              ) : (
                <EmptyCopy text="No active sessions for this stylist." />
              )}
            </div>
            <SectionLabel>Closed today ({closed.length})</SectionLabel>
            <div className="flex flex-col">
              {closed.length ? (
                closed.map((session) => (
                  <div
                    key={session.id}
                    className="flex justify-between py-3 border-b border-[var(--border-subtle)]"
                  >
                    <div>
                      <div className="text-sm text-[var(--text)]">
                        {session.customerName}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)]">
                        {session.services
                          .map((service) => service.name)
                          .join(" · ")}
                      </div>
                    </div>
                    <div className="text-right shrink-0 pl-3">
                      <div className="font-display font-700 text-[var(--text)]">
                        {formatAmount(session.total || 0)}
                      </div>
                      <div className="flex items-center justify-end gap-1 text-[10px] text-[var(--text-muted)] mt-0.5">
                        <Clock size={10} />
                        {formatMinutes(sessionMinutes(session.startTime, session.closedAt))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyCopy text="No sessions closed yet today." />
              )}
            </div>
          </div>
        )}
      </div>
      <StylistNav active={navTab} onSelect={onNav} />
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border-subtle)] p-3 min-w-0">
      <div className="font-display font-800 text-xl text-[var(--text)] truncate">
        {value}
      </div>
      <div className="text-[8px] tracking-wider uppercase text-[var(--text-muted)] mt-1">
        {label}
      </div>
    </div>
  )
}

function SessionCard({
  session,
  onClose,
}: {
  session: Session
  onClose: () => void
}) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border-subtle)]">
      <div className="p-4 flex items-center justify-between">
        <div>
          <div className="font-display font-700 text-[var(--text)]">
            {session.customerName}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] mt-1">
            <Clock size={10} /> {formatDuration(session.startTime)}
          </div>
        </div>
        <button
          className="bg-[var(--text)] text-[var(--bg)] px-4 py-2 font-display font-700 text-xs uppercase tracking-wider"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  )
}

function EmptyCopy({ text }: { text: string }) {
  return (
    <div className="py-8 text-center text-xs text-[var(--text-muted)]">
      {text}
    </div>
  )
}
