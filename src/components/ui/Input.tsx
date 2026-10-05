interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
}
export function Input({ label, hint, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[10px] font-medium tracking-widest uppercase text-[var(--text-muted)]">
          {label}
        </label>
      )}
      <input
        className={`w-full h-14 px-4 bg-[var(--surface)] border border-[var(--border)] rounded-sm text-[var(--text)] text-base placeholder-[var(--text-faint)] outline-none focus:border-[#3D6FA8] transition-colors ${className}`}
        {...props}
      />
      {hint && <p className="text-[11px] text-[var(--text-muted)]">{hint}</p>}
    </div>
  )
}
