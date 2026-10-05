import { Calendar, LayoutList, Menu, ReceiptText, Users, Wallet } from "lucide-react"

export const MGR_NAV = [
  { id: "manager-home", label: "Today", icon: Calendar },
  { id: "manager-sessions", label: "Sessions", icon: LayoutList },
  { id: "commission", label: "Payouts", icon: Users },
  { id: "cash", label: "Cash", icon: Wallet },
  { id: "expenses", label: "Expenses", icon: ReceiptText },
  { id: "manager-menu", label: "Menu", icon: Menu },
]

export function ManagerNav({
  active,
  onSelect,
}: {
  active: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="bottom-nav">
      {MGR_NAV.map((item) => {
        const Icon = item.icon
        const isActive = active === item.id
        return (
          <button
            key={item.id}
            className={`nav-item ${isActive ? "active" : ""}`}
            onClick={() => onSelect(item.id)}
          >
            <div
              className={`relative flex items-center justify-center w-6 h-5`}
            >
              <Icon
                size={isActive ? 18 : 17}
                strokeWidth={isActive ? 2 : 1.5}
              />
            </div>
            <span>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
