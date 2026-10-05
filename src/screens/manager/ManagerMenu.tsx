import { useBranchData } from "../../context/BranchDataContext"
import {
  LogOut,
  Moon,
  Sun,
  Building2,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
} from "lucide-react"
import { ManagerNav } from "../../components/layout"

interface Props {
  onNav: (screen: string) => void
  navTab: string
  onLogout: () => void
  theme: "dark" | "light"
  onThemeToggle: () => void
}

export default function ManagerMenu({
  onNav,
  navTab,
  onLogout,
  theme,
  onThemeToggle,
}: Props) {
  const { branchName } = useBranchData()
  return (
    <div className="flex flex-col h-full bg-[var(--bg)]">
      <div className="flex-1 overflow-y-auto pb-nav">
        <div className="px-5 pt-page pb-7 border-b border-[var(--border-subtle)]">
          <div className="text-[10px] tracking-[0.25em] uppercase text-[var(--text-muted)]">
            Manager workspace
          </div>
          <div className="font-display font-800 text-3xl tracking-wider text-[var(--text)] mt-1">
            {branchName.toUpperCase()}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">
            Branch controls and account settings
          </div>
        </div>

        <div className="px-5 py-5">
          <div className="text-[9px] tracking-[0.3em] uppercase text-[var(--text-faint)] mb-2">
            Preferences
          </div>
          <MenuRow
            icon={theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            label="Appearance"
            sub={`${theme === "dark" ? "Dark" : "Light"} theme`}
            onClick={onThemeToggle}
          />
          <MenuRow
            icon={<Building2 size={16} />}
            label="Branch profile"
            sub={branchName}
          />
          <MenuRow
            icon={<ShieldCheck size={16} />}
            label="Access & PIN"
            sub="Manager security"
          />

          <div className="text-[9px] tracking-[0.3em] uppercase text-[var(--text-faint)] mt-7 mb-2">
            Support
          </div>
          <MenuRow icon={<HelpCircle size={16} />} label="Help & support" />

          <div className="my-4 border-t border-[var(--border-subtle)]" />

          <button
            className="w-full flex items-center gap-4 py-4 tap-target text-left"
            onClick={onLogout}
          >
            <div className="w-8 h-8 flex items-center justify-center text-[#E06060]">
              <LogOut size={15} strokeWidth={1.5} />
            </div>
            <span className="text-sm font-medium text-[#E06060]">Log out</span>
          </button>
        </div>
      </div>
      <ManagerNav active={navTab} onSelect={onNav} />
    </div>
  )
}

function MenuRow({
  icon,
  label,
  sub,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  sub?: string
  onClick?: () => void
}) {
  return (
    <button
      className="w-full flex items-center gap-3 py-4 border-b border-[var(--border-subtle)] text-left"
      onClick={onClick}
    >
      <div className="w-9 h-9 bg-[var(--elevated)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)]">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-[var(--text)]">{label}</div>
        {sub && (
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
            {sub}
          </div>
        )}
      </div>
      <ChevronRight size={14} className="text-[var(--text-faint)]" />
    </button>
  )
}
