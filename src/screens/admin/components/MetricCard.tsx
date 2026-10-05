import { AdminCard } from "../components"

export function MetricCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode
  label: string
  value: string
  detail: string
}) {
  return (
    <AdminCard className="p-4 sm:p-5">
      <div className="flex items-center justify-between text-[var(--text-muted)]">
        <span className="text-[9px] tracking-[0.2em] uppercase">{label}</span>
        {icon}
      </div>
      <div className="font-display font-800 text-2xl sm:text-3xl mt-4">{value}</div>
      <div className="text-[10px] text-[var(--text-muted)] mt-1">{detail}</div>
    </AdminCard>
  )
}
