import { Button } from "./Button"

export function Dialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  variant = "default",
}: {
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: "default" | "destructive"
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.8)" }}
    >
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-sm w-full max-w-sm p-6 animate-slide-up">
        <h3 className="font-display font-700 tracking-wider uppercase text-base text-[var(--text)] mb-2">
          {title}
        </h3>
        <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-6">
          {message}
        </p>
        <div className="flex gap-3">
          {cancelLabel && (
            <Button variant="secondary" fullWidth onClick={onCancel}>
              {cancelLabel}
            </Button>
          )}
          <Button
            variant={variant === "destructive" ? "destructive" : "primary"}
            fullWidth
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
