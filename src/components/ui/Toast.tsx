import { CheckCircle2, AlertCircle } from "lucide-react"

/** Notification pill pinned to the top of the screen, below the status bar / notch. */
export function Toast({
  message,
  variant = "success",
}: {
  message: string
  variant?: "success" | "error"
}) {
  const ok = variant === "success"
  const Icon = ok ? CheckCircle2 : AlertCircle
  return (
    <div
      role={ok ? "status" : "alert"}
      className="pointer-events-none fixed inset-x-0 top-0 z-[110] flex justify-center px-4 pt-[max(0.75rem,calc(env(safe-area-inset-top)+0.25rem))]"
    >
      <div
        className="animate-toast-in flex w-full max-w-md items-center gap-3 overflow-hidden rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] py-3 pl-3 pr-4 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl"
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            ok ? "bg-[rgba(76,175,134,0.16)] text-[#4CAF86]" : "bg-[rgba(224,96,96,0.16)] text-[#E06060]"
          }`}
        >
          <Icon size={17} strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1 text-[13px] font-medium leading-snug text-[var(--text)]">
          {message}
        </span>
      </div>
    </div>
  )
}
