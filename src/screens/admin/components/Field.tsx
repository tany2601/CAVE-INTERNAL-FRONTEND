export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[9px] tracking-wider uppercase text-[var(--text-muted)]">
        {label}
      </span>
      {children}
    </label>
  )
}
