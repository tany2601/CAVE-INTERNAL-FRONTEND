import type { ReactNode } from "react"

export function BottomNav({
  items,
  active,
  onSelect,
}: {
  items: { id: string; label: string; icon: ReactNode }[]
  active: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="bottom-nav">
      {items.map((item) => (
        <button
          key={item.id}
          className={`nav-item ${active === item.id ? "active" : ""}`}
          onClick={() => onSelect(item.id)}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  )
}
