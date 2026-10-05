import { BrandLogo } from "./BrandLogo"

const HEIGHTS = { sm: 22, md: 32, lg: 44 }

export function Logo({
  size = "md",
  subtitle,
}: {
  size?: "sm" | "md" | "lg"
  subtitle?: string
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <BrandLogo height={HEIGHTS[size]} />
      {subtitle && (
        <div className="text-[9px] font-medium tracking-[0.35em] uppercase text-[var(--text-muted)]">
          {subtitle}
        </div>
      )}
    </div>
  )
}
