import type { ReactNode, ButtonHTMLAttributes } from "react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline"
  /** "icon" is a square, padding-free button for a single icon. */
  size?: "sm" | "md" | "lg" | "icon"
  fullWidth?: boolean
  children: ReactNode
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center whitespace-nowrap font-display font-600 tracking-wider uppercase transition-all tap-target rounded-sm select-none disabled:opacity-40 disabled:pointer-events-none"
  const variants = {
    primary:
      "bg-[var(--text)] text-[var(--bg)] active:bg-[var(--text-secondary)]",
    secondary:
      "bg-[var(--elevated)] text-[var(--text)] border border-[var(--border)] active:bg-[var(--border)]",
    ghost:
      "bg-transparent text-[var(--text-secondary)] active:text-[var(--text)]",
    destructive:
      "bg-[rgba(125,46,46,0.2)] text-[#E06060] border border-[rgba(125,46,46,0.3)] active:bg-[rgba(125,46,46,0.3)]",
    outline:
      "bg-transparent text-[var(--text)] border border-[var(--border)] active:bg-[var(--elevated)]",
  }
  const sizes = {
    sm: "h-9 px-4 text-xs gap-1.5",
    md: "h-12 px-6 text-sm gap-2",
    lg: "h-14 px-8 text-base gap-2",
    icon: "h-10 w-10 p-0 shrink-0",
  }
  return (
    <button
      data-haptic={variant === "destructive" ? "heavy" : variant === "primary" ? "medium" : undefined}
      className={`${base} ${variants[variant]} ${sizes[size]} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
