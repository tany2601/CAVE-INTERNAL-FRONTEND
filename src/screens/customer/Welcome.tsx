import { useState } from "react"
import {
  Menu,
  ArrowRight,
  ReceiptText,
  Moon,
  Sun,
  X,
  Clock,
} from "lucide-react"
import { Session } from "../../types"
import { formatDuration } from "../../lib/format"
import { BrandLogo } from "../../components/ui"
import { useBranchData } from "../../context/BranchDataContext"

interface Props {
  onStart: () => void
  onMenu: () => void
  onQuickBill: (session: Session) => void
  activeSessions: Session[]
  role: "stylist" | "manager"
  theme: "dark" | "light"
  onThemeToggle: () => void
}

export default function Welcome({
  onStart,
  onMenu,
  onQuickBill,
  activeSessions,
  role,
  theme,
  onThemeToggle,
}: Props) {
  const [showSessions, setShowSessions] = useState(false)
  const { getStylist, branchShort } = useBranchData()

  return (
    <div className="flex flex-col min-h-full relative overflow-hidden animate-fade-in bg-[var(--bg)]">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=900&h=1600&fit=crop&auto=format&q=85)",
        }}
      />
      <div
        className="absolute inset-0 z-1"
        style={{
          background:
            "linear-gradient(to bottom, rgba(5,5,5,.78), rgba(5,5,5,.08) 42%, rgba(5,5,5,.96) 82%, #050505)",
        }}
      />

      <div className="relative z-10 flex items-center justify-between px-5 pt-page-fluid pb-2 text-white">
        <div>
          <BrandLogo height={24} onPhoto />
          <div className="text-[9px] tracking-[0.35em] uppercase text-white/45 mt-1">
            {branchShort}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            aria-label={`Switch to ${
              theme === "dark" ? "light" : "dark"
            } theme`}
            className="w-10 h-10 flex items-center justify-center text-white/70 tap-target rounded-full bg-black/25 backdrop-blur-sm"
            onClick={onThemeToggle}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            aria-label="Open dashboard"
            className="w-10 h-10 flex items-center justify-center text-white/70 tap-target rounded-full bg-black/25 backdrop-blur-sm"
            onClick={onMenu}
          >
            <Menu size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="relative z-10 mt-auto px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex flex-col gap-5 text-white">
        <div>
          <div className="text-[10px] tracking-[0.4em] uppercase text-white/45 mb-2">
            {role === "manager"
              ? "Manager workspace · ready"
              : "Premium men’s grooming"}
          </div>
          <div className="font-display font-800 leading-[0.86] text-[3.25rem] tracking-tight">
            LOOK
            <br />
            SHARP.
          </div>
          <div className="font-display font-300 text-xl tracking-[0.08em] text-white/60 mt-2">
            FEEL CONFIDENT.
          </div>
        </div>

        <button
          className="flex items-center justify-between bg-white text-black h-14 px-5 font-display font-700 tracking-[0.18em] uppercase text-sm tap-target active:bg-neutral-200"
          onClick={onStart}
        >
          Start a session
          <ArrowRight size={17} strokeWidth={2} />
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            className="h-12 border border-white/25 bg-black/25 backdrop-blur-sm flex items-center justify-center gap-2 font-display font-600 tracking-[0.14em] uppercase text-xs"
            onClick={() => setShowSessions(true)}
          >
            <ReceiptText size={15} />
            Quick bill
          </button>
          <button
            className="h-12 border border-white/25 bg-black/25 backdrop-blur-sm flex items-center justify-center gap-2 font-display font-600 tracking-[0.14em] uppercase text-xs"
            onClick={onMenu}
          >
            <Menu size={15} />
            Dashboard
          </button>
        </div>
      </div>

      {showSessions && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75"
          onClick={() => setShowSessions(false)}
        >
          <div
            className="bg-[var(--surface)] border-t border-[var(--border)] rounded-t-2xl p-5 pb-8 max-h-[85dvh] overflow-y-auto animate-sheet-up"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="font-display font-800 text-xl tracking-wider uppercase text-[var(--text)]">
                  Quick bill
                </div>
                <div className="text-xs text-[var(--text-muted)] mt-1">
                  Choose an active customer to check out.
                </div>
              </div>
              <button
                className="w-9 h-9 flex items-center justify-center text-[var(--text-muted)]"
                onClick={() => setShowSessions(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {activeSessions.map((session) => (
                <button
                  key={session.id}
                  className="w-full flex items-center justify-between p-4 bg-[var(--elevated)] border border-[var(--border-subtle)] text-left card-press"
                  onClick={() => onQuickBill(session)}
                >
                  <div>
                    <div className="font-display font-700 tracking-wide text-[var(--text)]">
                      {session.customerName}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-1">
                      {getStylist(session.stylistId) ? `with ${getStylist(session.stylistId)?.name}` : "No stylist assigned"}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                    <Clock size={12} />
                    {formatDuration(session.startTime)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
