export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-[var(--elevated)] rounded-sm animate-pulse ${className}`}
    />
  )
}
