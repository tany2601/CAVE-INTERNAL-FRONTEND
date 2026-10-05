import { EmptyNote } from "../../components/ui"
import { useState } from "react"
import { Badge, Dialog } from "../../components/ui"
import { formatTime, formatDuration, formatAmount } from "../../lib/format"
import { useBranchData } from "../../context/BranchDataContext"
import { staffApi } from "../../lib/api"
import { Session } from "../../types"
import { Clock } from "lucide-react"
import { ManagerNav } from "../../components/layout"

interface Props {
  onNav: (screen: string) => void
  navTab: string
  onCloseSession: (session: Session) => void
  onEditSession: (session: Session) => void
}

export default function Sessions({
  onNav,
  navTab,
  onCloseSession,
  onEditSession,
}: Props) {
  const { activeSessions, closedSessions, getStylist, refresh } =
    useBranchData()
  const [deleting, setDeleting] = useState<Session | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [tab, setTab] = useState<"active" | "closed">("active")

  return (
    <div className="flex flex-col h-full bg-[var(--bg)]">
      {/* Header */}
      <div className="px-5 pt-page pb-0 border-b border-[var(--border-subtle)] flex-shrink-0">
        <div className="text-[10px] tracking-[0.25em] uppercase text-[var(--text-subtle)]">
          Today's
        </div>
        <div className="font-display font-800 text-2xl tracking-wider text-[var(--text)] mt-0.5 mb-4">
          Sessions
        </div>
        <div className="flex">
          {[
            ["active", activeSessions.length],
            ["closed", closedSessions.length],
          ].map(([t, count]) => (
            <button
              key={t}
              className={`flex-1 py-3 text-[11px] tracking-[0.2em] uppercase tap-target border-b-2 transition-all ${
                tab === t
                  ? "border-[var(--text)] text-[var(--text)]"
                  : "border-transparent text-[var(--text-subtle)]"
              }`}
              onClick={() => setTab(t as "active" | "closed")}
            >
              {String(t)} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pb-nav px-5 py-4 flex flex-col gap-2.5">
        {(tab === "active" ? activeSessions : closedSessions).length === 0 && (
          <EmptyNote>
            {tab === "active"
              ? "No active sessions right now."
              : "No sessions have been closed today."}
          </EmptyNote>
        )}
        {tab === "active"
          ? activeSessions.map((session) => {
              const stylist = getStylist(session.stylistId)
              return (
                <div
                  key={session.id}
                  className="bg-[var(--surface)] border border-[var(--border-subtle)] overflow-hidden"
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
                        {session.customerPhone && (
                          <div className="text-[10px] text-[var(--text-subtle)]">
                            {session.customerPhone}
                          </div>
                        )}
                        <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
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
                      className="shrink-0 self-stretch px-4 py-2.5 border-l border-[var(--border-subtle)] text-[10px] tracking-[0.15em] uppercase text-[var(--text-secondary)] tap-target font-display font-700 active:bg-[var(--text)] active:text-[var(--bg)] transition-all"
                      onClick={() => onCloseSession(session)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )
            })
          : closedSessions.map((session) => {
              const stylist = getStylist(session.stylistId)
              return (
                <div
                  key={session.id}
                  className="bg-[var(--surface)] border border-[var(--border-subtle)]"
                  style={{ borderRadius: "4px" }}
                >
                  <div className="flex items-center justify-between p-4 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[var(--elevated)] border border-[var(--border)] flex items-center justify-center font-display font-700 text-xs text-[var(--text-secondary)]">
                        {session.customerName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-display font-700 tracking-wide text-sm text-[var(--text)]">
                          {session.customerName}
                        </div>
                        {session.customerPhone && (
                          <div className="text-[10px] text-[var(--text-subtle)]">
                            {session.customerPhone}
                          </div>
                        )}
                        <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                          {stylist ? `with ${stylist.name}` : "No stylist assigned"} · {session.closedAt ? formatTime(session.closedAt) : ""}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display font-800 text-base text-[var(--text)]">
                        {formatAmount(session.total!)}
                      </div>
                      <div
                        className={`text-[9px] uppercase tracking-wider ${
                          session.paymentMode === "gpay"
                            ? "text-[#6B9FD4]"
                            : "text-[var(--text-subtle)]"
                        }`}
                      >
                        {session.paymentMode}
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-[var(--border-subtle)] px-4 py-2.5 flex items-center justify-between">
                    <div className="flex gap-1.5 flex-wrap">
                      {session.services.map((s) => (
                        <span
                          key={s.id}
                          className="text-[9px] bg-[var(--elevated)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-full text-[var(--text-muted)]"
                        >
                          {s.name}
                        </span>
                      ))}
                      {session.tip && session.tip > 0 && (
                        <span className="text-[9px] bg-[var(--elevated)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-full text-[#4CAF86]">
                          Tip ₹{session.tip}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2.5">
                      <button
                        className="text-[9px] tracking-[0.15em] uppercase text-[var(--text-subtle)] tap-target"
                        onClick={() => onEditSession(session)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-[9px] tracking-[0.15em] uppercase text-[#E06060] tap-target"
                        onClick={() => {
                          setDeleteError(null)
                          setDeleting(session)
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
      </div>

      {deleting && (
        <Dialog
          title="Delete this session?"
          message={
            deleteError ??
            `${deleting.customerName}'s bill will be voided and removed from today's revenue, commission and loyalty. This cannot be undone.`
          }
          confirmLabel="Delete session"
          cancelLabel="Cancel"
          variant="destructive"
          onCancel={() => setDeleting(null)}
          onConfirm={async () => {
            try {
              await staffApi.deleteSession(deleting.id)
              await refresh()
              setDeleting(null)
            } catch (e) {
              setDeleteError(
                e instanceof Error ? e.message : "Could not delete the session.",
              )
            }
          }}
        />
      )}

      <ManagerNav active={navTab} onSelect={onNav} />
    </div>
  )
}
