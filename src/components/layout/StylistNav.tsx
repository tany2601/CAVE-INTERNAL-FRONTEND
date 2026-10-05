import { CheckSquare, Home, Menu, TrendingUp } from "lucide-react"

export const STYLIST_NAV = [
  { id: "home", label: "Home", icon: Home },
  { id: "stylist-performance", label: "Stats", icon: TrendingUp },
  { id: "stylist-checklist", label: "Tasks", icon: CheckSquare },
  { id: "stylist-menu", label: "Menu", icon: Menu },
]

export function StylistNav({
  active,
  onSelect,
}: {
  active: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="bottom-nav">
      {STYLIST_NAV.map((item) => {
        const Icon = item.icon
        const isActive = active === item.id
        return (
          <button
            key={item.id}
            className={`nav-item ${isActive ? "active" : ""}`}
            onClick={() => onSelect(item.id)}
          >
            <div className="relative flex items-center justify-center w-6 h-5">
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
