export function StatusBadge({
  label,
  tone = "success",
}: {
  label: string
  tone?: "success" | "danger" | "info"
}) {
  const styles = {
    success: "bg-[rgba(46,125,88,0.14)] text-[#4CAF86]",
    danger: "bg-[rgba(125,46,46,0.18)] text-[#E06060]",
    info: "bg-[rgba(61,111,168,0.15)] text-[#6B9FD4]",
  }
  return (
    <span
      className={`inline-flex h-6 min-w-[5.5rem] max-w-[10rem] shrink-0 items-center justify-center whitespace-nowrap rounded-full px-3 text-[9px] tracking-wider uppercase ${styles[tone]}`}
    >
      <span className="truncate">{label}</span>
    </span>
  )
}
