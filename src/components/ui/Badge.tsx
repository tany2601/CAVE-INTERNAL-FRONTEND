import type { ReactNode } from "react"

export function Badge({
  children,
  variant = "default",
}: {
  children: ReactNode
  variant?: "default" | "success" | "warning" | "destructive" | "accent"
}) {
  const styles = {
    default:
      "bg-[var(--elevated-strong)] text-[var(--text-secondary)] border-[var(--border)]",
    success:
      "bg-[rgba(46,125,88,0.15)] text-[#4CAF86] border-[rgba(46,125,88,0.25)]",
    warning:
      "bg-[rgba(128,128,128,0.15)] text-[var(--text-secondary)] border-[rgba(128,128,128,0.25)]",
    destructive:
      "bg-[rgba(125,46,46,0.15)] text-[#E06060] border-[rgba(125,46,46,0.25)]",
    accent:
      "bg-[rgba(61,111,168,0.15)] text-[#6B9FD4] border-[rgba(61,111,168,0.25)]",
  }
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[4.5rem] whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-medium tracking-widest uppercase border ${styles[variant]}`}
    >
      {children}
    </span>
  )
}
