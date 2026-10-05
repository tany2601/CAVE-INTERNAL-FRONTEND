export function AdminCard({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={`admin-card ${className}`}>{children}</div>
}
