import type { GstMode } from "../../../lib/gst"

const OPTIONS: { mode: GstMode; label: string; hint: string }[] = [
  { mode: "ADD_ON_TOP", label: "+ GST", hint: "GST is added on top of the menu price" },
  { mode: "INCLUDED_IN_PRICE", label: "Incl. GST", hint: "GST is inside the menu price" },
  { mode: "NO_GST", label: "No GST", hint: "No GST on this service" },
]

/** + GST | Incl. GST | No GST: three buttons side by side, the chosen one filled. */
export function GstModeSelector({ value, onChange, name }: { value: GstMode; onChange: (mode: GstMode) => void; name: string }) {
  return (
    <div className="inline-flex shrink-0 overflow-hidden rounded-sm border border-[var(--border)]" role="radiogroup" aria-label={`${name}: how GST works`}>
      {OPTIONS.map(({ mode, label, hint }) => (
        <button
          key={mode}
          type="button"
          role="radio"
          aria-checked={value === mode}
          aria-label={`${name}: ${hint}`}
          title={hint}
          className={`h-8 whitespace-nowrap px-2.5 text-[11px] font-700 tracking-wide transition-colors ${
            value === mode
              ? mode === "NO_GST"
                ? "bg-[#B45309] text-white"
                : mode === "INCLUDED_IN_PRICE"
                  ? "bg-[#3D6FA8] text-white"
                  : "bg-[var(--text)] text-[var(--bg)]"
              : "bg-[var(--elevated)] text-[var(--text-muted)]"
          }`}
          onClick={() => onChange(mode)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
