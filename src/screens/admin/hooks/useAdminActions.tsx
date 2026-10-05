import { useState } from "react"
import { Dialog, Toast } from "../../../components/ui"

export interface ConfirmRequest {
  title: string
  message: string
  confirmLabel: string
  destructive?: boolean
  action: () => void | Promise<void>
  successMessage?: string
}

export function useAdminActions() {
  const [confirmation, setConfirmation] = useState<ConfirmRequest | null>(null)
  const [toast, setToast] = useState("")
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success")

  const showToast = (message: string, variant: "success" | "error") => {
    setToastVariant(variant)
    setToast(message)
    window.setTimeout(() => setToast(""), variant === "error" ? 4000 : 2400)
  }

  const request = (config: ConfirmRequest) => setConfirmation(config)
  const confirm = async () => {
    if (!confirmation) return
    const { action, successMessage } = confirmation
    setConfirmation(null)
    try {
      await action()
      if (successMessage) showToast(successMessage, "success")
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Something went wrong", "error")
    }
  }

  const feedback = (
    <>
      {confirmation && (
        <Dialog
          title={confirmation.title}
          message={confirmation.message}
          confirmLabel={confirmation.confirmLabel}
          cancelLabel="Cancel"
          onConfirm={confirm}
          onCancel={() => setConfirmation(null)}
          variant={confirmation.destructive ? "destructive" : "default"}
        />
      )}
      {toast && <Toast message={toast} variant={toastVariant} />}
    </>
  )

  return { request, feedback }
}
