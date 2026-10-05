import pkg from "../../../package.json"
import { BrandLogo } from "../../components/ui"
import { InstallPrompt } from "../../components/InstallPrompt"
import { Scissors, LayoutDashboard } from "lucide-react"

interface Props {
  onSelect: (role: "stylist" | "manager") => void
}

export default function RoleSelection({ onSelect }: Props) {
  return (
    <div className="flex flex-col min-h-full bg-[var(--bg)] animate-fade-in relative overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=900&h=1600&fit=crop&auto=format&q=80)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.5,
        }}
      />
      <div
        className="absolute inset-0 z-1"
        style={{
          background:
            "linear-gradient(to bottom, var(--bg) 0%, rgba(9,9,9,0.6) 40%, rgba(9,9,9,0.7) 70%, var(--bg) 100%)",
        }}
      />

      <div className="relative z-10 flex flex-col min-h-[100dvh] px-6">
        {/* Logo block */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <BrandLogo height={56} />
          <div className="text-[9px] tracking-[0.4em] uppercase text-[var(--text-subtle)]">
            MEN'S SALON
          </div>
        </div>

        {/* Bottom content */}
        <div className="pb-14 flex flex-col gap-6">
          <div className="text-center">
            <div className="text-[11px] tracking-[0.25em] uppercase text-[var(--text-muted)]">
              How are you signing in?
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <RoleCard
              icon={<Scissors size={18} strokeWidth={1.5} />}
              title="Stylist"
              description="Start sessions · Add services · Close"
              onClick={() => onSelect("stylist")}
            />
            <RoleCard
              icon={<LayoutDashboard size={18} strokeWidth={1.5} />}
              title="Manager"
              description="Revenue · Commission · Cash · Expenses"
              onClick={() => onSelect("manager")}
            />
          </div>

          <InstallPrompt />

          <div className="text-center text-[9px] tracking-[0.3em] uppercase text-[var(--border)]">
            CAVE · v{pkg.version}
          </div>
        </div>
      </div>
    </div>
  )
}

function RoleCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      className="w-full flex items-center gap-4 bg-[var(--surface)] border border-[var(--border-subtle)] px-5 py-4 text-left tap-target card-press group transition-all active:border-[var(--text)]/20"
      style={{ borderRadius: "2px" }}
      onClick={onClick}
    >
      <div className="w-9 h-9 rounded-sm bg-[var(--elevated)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] flex-shrink-0 group-active:text-[var(--text)] transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-display font-700 tracking-[0.2em] uppercase text-lg text-[var(--text)]">
          {title}
        </div>
        <div className="text-[11px] text-[var(--text-subtle)] mt-0.5">
          {description}
        </div>
      </div>
      <div className="text-[var(--text-faint)] group-active:text-[var(--text)] transition-colors">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M5 3l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </button>
  )
}
