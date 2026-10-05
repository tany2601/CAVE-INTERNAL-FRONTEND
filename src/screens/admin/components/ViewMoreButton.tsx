import {
  ChevronDown,
} from "lucide-react"

export function ViewMoreButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="admin-view-more" onClick={onClick}>
      View more
      <ChevronDown size={14} />
    </button>
  )
}
