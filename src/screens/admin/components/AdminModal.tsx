import {
  X,
} from "lucide-react"

export function AdminModal({
  title,
  children,
  onClose,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-5">
      <div className="admin-modal w-full sm:max-w-2xl animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div className="font-display font-800 text-2xl sm:text-3xl tracking-wider uppercase">
            {title}
          </div>
          <button className="admin-icon-button" onClick={onClose}>
            <X size={17} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
