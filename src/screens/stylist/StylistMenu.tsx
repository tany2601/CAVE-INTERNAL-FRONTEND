import { useBranchData } from "../../context/BranchDataContext"
import { StylistNav } from "../../components/layout"
import {
  TrendingUp,
  CheckSquare,
  LogOut,
  HelpCircle,
  MapPin,
  ChevronRight,
  Sun,
  Moon,
} from "lucide-react"

interface Props {
  stylist: { name: string; id: string }
  onNav: (screen: string) => void
  navTab: string
  onLogout: () => void
  theme: "dark" | "light"
  onThemeToggle: () => void
}

export default function StylistMenu({
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
        {/* Profile header */}
        <div className="relative overflow-hidden px-5 pt-page pb-8 border-b border-[var(--border-subtle)]">
          <div
            className="absolute inset-0 z-0 opacity-5"
            style={{
              backgroundImage: `url(/images/photos/1622286342621-4bd786c2447c.jpg)`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[var(--elevated)] border border-[var(--border)] flex items-center justify-center font-display font-800 text-2xl text-[var(--text-secondary)]">
              ST
            </div>
            <div>
              <div className="font-display font-800 tracking-[0.12em] uppercase text-2xl text-[var(--text)] leading-none">
                Hello, Stylists
              </div>
              <div className="text-[10px] text-[var(--text-subtle)] tracking-[0.2em] uppercase mt-1.5">
                {branchName} ·{" "}
                {new Date().toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Menu items */}
        <div className="px-5 pt-4">
          <MenuGroup label="Workspace">
            <MenuItem
              icon={<TrendingUp size={15} strokeWidth={1.5} />}
              label="Performance"
              onClick={() => onNav("stylist-performance")}
            />
            <MenuItem
              icon={<CheckSquare size={15} strokeWidth={1.5} />}
              label="Checklist"
              onClick={() => onNav("stylist-checklist")}
            />
          </MenuGroup>

          <div className="my-4 border-t border-[var(--border-subtle)]" />

          <MenuGroup label="Account">
            <MenuItem
              icon={theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              label="Appearance"
              sub={`${theme === "dark" ? "Dark" : "Light"} theme`}
              onClick={onThemeToggle}
            />
            <MenuItem
              icon={<MapPin size={15} strokeWidth={1.5} />}
              label="Branch"
              sub={branchName}
            />
          </MenuGroup>

          <div className="my-4 border-t border-[var(--border-subtle)]" />

          <MenuGroup label="Support">
            <MenuItem
              icon={<HelpCircle size={15} strokeWidth={1.5} />}
              label="Help & Support"
            />
          </MenuGroup>

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

      {/* Bottom nav */}
      <StylistNav active={navTab} onSelect={onNav} />
    </div>
  )
}

function MenuGroup({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="text-[9px] tracking-[0.35em] uppercase text-[var(--border)] mb-1">
        {label}
      </div>
      {children}
    </div>
  )
}

function MenuItem({
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
      className="w-full flex items-center gap-4 py-3.5 border-b border-[var(--border-subtle)] tap-target text-left last:border-0"
      onClick={onClick}
    >
      <div className="w-8 h-8 flex items-center justify-center text-[var(--text-subtle)]">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-[var(--text)] font-medium">{label}</div>
        {sub && (
          <div className="text-[10px] text-[var(--text-subtle)] mt-0.5">
            {sub}
          </div>
        )}
      </div>
      <ChevronRight
        size={13}
        className="text-[var(--border)]"
        strokeWidth={1.5}
      />
    </button>
  )
}
