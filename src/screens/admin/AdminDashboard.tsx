import { useState } from "react"
import {
  Activity,
  Building2,
  CalendarRange,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  RefreshCw,
  ReceiptText,
  Settings,
  Tags,
  UserCheck,
  UserRound,
  UserPlus,
  Users,
  WalletCards,
  X,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { adminApi } from "../../lib/api"
import { BrandLogo } from "../../components/ui"
import { storageKeys } from "../../context/AuthContext"
import { useDataRefresh } from "../../context/DataRefreshContext"
import { useAsyncData } from "../../hooks/useAsyncData"
import type { AdminSection } from "./adminTypes"
import { useAdminActions } from "./hooks/useAdminActions"
import type { BranchTab, Period } from "./types"
import {
  Overview,
  BranchDetail,
  SessionsView,
  CustomersView,
  CommissionView,
  EmployeesView,
  MonthlyView,
  ExpensesView,
  SettingsView,
  StaffManagementView,
  BranchManagementView,
  RetentionView,
  BranchPulseView,
  PricingView,
  ProductsView,
} from "./views"

interface Props {
  onLogout: () => void
}

interface AdminNavGroup {
  id: string
  label: string
  items: { id: AdminSection; label: string; icon: LucideIcon }[]
}

const navGroups: AdminNavGroup[] = [
  {
    id: "insights",
    label: "Insights",
    items: [
      { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
      { id: "monthly" as const, label: "Monthly tracker", icon: CalendarRange },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      { id: "sessions" as const, label: "Sessions", icon: Activity },
      {
        id: "branch-management" as const,
        label: "Branches",
        icon: Building2,
      },
      { id: "expenses" as const, label: "Expenses", icon: ReceiptText },
      { id: "pricing" as const, label: "Menu pricing", icon: Tags },
      { id: "products" as const, label: "Products", icon: Package },
    ],
  },
  {
    id: "customers",
    label: "Customers",
    items: [
      { id: "customers" as const, label: "Customer database", icon: Users },
      { id: "retention" as const, label: "Retention", icon: UserCheck },
    ],
  },
  {
    id: "employees",
    label: "Employees",
    items: [
      { id: "employees" as const, label: "Employees", icon: UserRound },
      {
        id: "staff-management" as const,
        label: "Manager / staff management",
        icon: UserPlus,
      },
      { id: "commission" as const, label: "Commission", icon: WalletCards },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [{ id: "settings" as const, label: "Settings", icon: Settings }],
  },
]

export default function AdminDashboard({ onLogout }: Props) {
  const adminActions = useAdminActions()
  const [section, setSection] = useState<AdminSection>(() => {
    try {
      return (sessionStorage.getItem(storageKeys.adminSection) as AdminSection) || "overview"
    } catch {
      return "overview"
    }
  })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<string[]>([
    "insights",
    "operations",
    "customers",
    "employees",
    "system",
  ])
  const [selectedBranch, setSelectedBranch] = useState<{ id: string; name: string } | null>(null)
  const profile = useAsyncData(() => adminApi.getAdminProfile())
  const { refreshAll, refreshing } = useDataRefresh()
  const [branchTab, setBranchTab] = useState<BranchTab>("summary")
  const [period, setPeriod] = useState<Period>("Today")

  const navigate = (next: AdminSection) => {
    setSection(next)
    try {
      sessionStorage.setItem(storageKeys.adminSection, next)
    } catch {
      // ignore
    }
    setSelectedBranch(null)
    setDrawerOpen(false)
  }

  const title = selectedBranch
    ? selectedBranch.name
    : section === "branch-pulse"
      ? "Branch pulse"
      : navGroups.flatMap((group) => group.items).find((item) => item.id === section)
        ?.label || "Admin"

  return (
    <div className="admin-shell flex h-full flex-col bg-[var(--bg)] text-[var(--text)]">
      <header className="shrink-0 min-h-[4.5rem] px-4 sm:px-6 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 border-b border-[var(--border-subtle)] bg-[var(--surface-soft)] flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            className="admin-icon-button"
            aria-label="Open admin navigation"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={19} />
          </button>
          <div className="min-w-0">
            <BrandLogo height={20} />
            <div className="text-[9px] tracking-[0.25em] uppercase text-[var(--text-muted)] mt-2 leading-none truncate">
              Admin<span className="hidden sm:inline"> · {title}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="admin-icon-button"
            aria-label="Refresh data"
            title="Refresh data"
            onClick={refreshAll}
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
          <button
            className="admin-icon-button"
            aria-label="Log out admin"
            onClick={() =>
              adminActions.request({
                title: "Log out of Admin?",
                message:
                  "You will return to the role selection screen and need the Admin PIN to enter again.",
                confirmLabel: "Yes, log out",
                destructive: true,
                action: onLogout,
              })
            }
          >
            <LogOut size={17} />
          </button>
        </div>
      </header>

      <aside
        className={`fixed inset-y-0 left-0 z-[70] flex w-[min(88vw,320px)] flex-col bg-[var(--surface-soft)] border-r border-[var(--border-subtle)] transition-transform duration-300 ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="shrink-0 min-h-20 px-5 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div>
            <BrandLogo height={26} />
            <div className="text-[9px] tracking-[0.28em] pt-2 uppercase text-[var(--text-muted)]">
              Control center
            </div>
          </div>
          <button
            className="admin-icon-button"
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto p-4 pb-8">
          {navGroups.map((group) => {
            const expanded = expandedGroups.includes(group.id)
            return (
              <div key={group.id} className="mb-3">
                <button
                  className="w-full h-9 px-2 flex items-center justify-between text-[9px] tracking-[0.24em] uppercase text-[var(--text-muted)]"
                  onClick={() =>
                    setExpandedGroups((current) =>
                      expanded
                        ? current.filter((id) => id !== group.id)
                        : [...current, group.id],
                    )
                  }
                >
                  {group.label}
                  <ChevronDown
                    size={13}
                    className={`transition-transform ${expanded ? "rotate-180" : ""}`}
                  />
                </button>
                {expanded && (
                  <div className="flex flex-col gap-1">
                    {group.items.map((item) => {
                      const Icon = item.icon
                      const active =
                        (section === item.id || (item.id === "overview" && section === "branch-pulse")) &&
                        !selectedBranch
                      return (
                        <button
                          key={item.id}
                          className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors ${
                            active
                              ? "bg-[var(--text)] text-[var(--bg)]"
                              : "text-[var(--text-secondary)] hover:bg-[var(--elevated)]"
                          }`}
                          onClick={() => navigate(item.id)}
                        >
                          <Icon size={17} strokeWidth={1.6} />
                          <span className="flex-1 text-left">{item.label}</span>
                          {active && <ChevronRight size={14} />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
        <div className="shrink-0 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-[var(--border-subtle)]">
          <div className="rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] p-3">
            <div className="text-xs font-600">{profile.data?.name ?? "Admin"}</div>
            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
              Super admin · {profile.data?.branchCount ?? 0}{" "}
              {profile.data?.branchCount === 1 ? "branch" : "branches"}
            </div>
          </div>
        </div>
      </aside>

      {drawerOpen && (
        <button
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
          aria-label="Close navigation"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <main className="min-h-0 flex-1 overflow-y-auto">
        {selectedBranch ? (
          <BranchDetail
            branch={selectedBranch}
            tab={branchTab}
            period={period}
            onTab={setBranchTab}
            onPeriod={setPeriod}
            onBack={() => setSelectedBranch(null)}
          />
        ) : (
          <>
            {section === "overview" && (
              <Overview
                period={period}
                onPeriod={setPeriod}
                onBranch={(id, name) => setSelectedBranch({ id, name })}
                onViewAllBranches={() => navigate("branch-pulse")}
                adminName={profile.data?.name ?? "Admin"}
              />
            )}
            {section === "branch-pulse" && (
              <BranchPulseView
                period={period}
                onPeriod={setPeriod}
                onBranch={(id, name) => setSelectedBranch({ id, name })}
                onBack={() => navigate("overview")}
              />
            )}
            {section === "sessions" && <SessionsView />}
            {section === "customers" && <CustomersView />}
            {section === "commission" && <CommissionView />}
            {section === "employees" && <EmployeesView />}
            {section === "staff-management" && <StaffManagementView />}
            {section === "branch-management" && <BranchManagementView />}
            {section === "monthly" && <MonthlyView />}
            {section === "expenses" && <ExpensesView />}
            {section === "settings" && <SettingsView />}
            {section === "retention" && <RetentionView />}
            {section === "pricing" && <PricingView />}
            {section === "products" && <ProductsView />}
          </>
        )}
      </main>
      {adminActions.feedback}
    </div>
  )
}
