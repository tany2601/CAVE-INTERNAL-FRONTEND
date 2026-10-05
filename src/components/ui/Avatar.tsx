export function Avatar({
  name,
  size = "md",
}: {
  name: string
  size?: "sm" | "md" | "lg"
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
  }
  return (
    <div
      className={`${sizes[size]} rounded-full bg-[var(--elevated-strong)] border border-[var(--border)] flex items-center justify-center font-display font-600 text-[var(--text-secondary)] tracking-wide flex-shrink-0`}
    >
      {initials}
    </div>
  )
}
