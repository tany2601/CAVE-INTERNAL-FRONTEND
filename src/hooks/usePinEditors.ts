import { useEffect, useState } from "react"
import { adminApi } from "../lib/api"
import { useAsyncData } from "./useAsyncData"

/**
 * Edits one role's login PIN for whichever branch is selected. The field is prefilled with
 * the branch's current PIN and only counts as changed (and savable) once it differs.
 */
export function useRolePinEditor(
  branches: { id: string }[],
  role: "MANAGER" | "STYLIST",
) {
  const [branchId, setBranchId] = useState("")
  const selected = branchId || branches[0]?.id || ""
  const values = useAsyncData(
    () => (selected ? adminApi.getBranchRolePinValues(selected) : Promise.resolve(undefined)),
    [selected],
  )
  const entry = values.data?.roles.find((r) => r.role === role)
  const original = entry?.pin ?? ""
  const [draft, setDraft] = useState("")

  // Re-prefill whenever another branch is chosen or fresh values arrive.
  useEffect(() => {
    setDraft(original)
  }, [selected, original, values.data])

  const valid = /^\d{4}$/.test(draft)
  return {
    branchId: selected,
    setBranchId,
    draft,
    setDraft: (value: string) => setDraft(value.replace(/\D/g, "").slice(0, 4)),
    loading: values.loading && !values.data,
    /** The PIN exists but was set before PINs were viewable, so it can't be shown. */
    unrecoverable: !!entry?.isConfigured && entry.pin === null,
    notConfigured: !!values.data && !entry?.isConfigured,
    dirty: draft !== original,
    valid,
    canSave: draft !== original && valid,
    save: async () => {
      await adminApi.setBranchRolePin(selected, role, draft)
      await values.reload()
    },
  }
}

/** Same idea for the 6-digit Admin PIN. Changing it needs the current PIN, which we already hold. */
export function useAdminPinEditor() {
  const current = useAsyncData(() => adminApi.getAdminPin())
  const original = current.data ?? ""
  const [draft, setDraft] = useState("")
  const [typedCurrent, setTypedCurrent] = useState("")

  useEffect(() => {
    setDraft(original)
  }, [original, current.data])

  const unrecoverable = !current.loading && current.data === null
  const valid = /^\d{6}$/.test(draft)
  const currentOk = !unrecoverable || /^\d{6}$/.test(typedCurrent)
  return {
    draft,
    setDraft: (value: string) => setDraft(value.replace(/\D/g, "").slice(0, 6)),
    typedCurrent,
    setTypedCurrent: (value: string) => setTypedCurrent(value.replace(/\D/g, "").slice(0, 6)),
    loading: current.loading && current.data === undefined,
    unrecoverable,
    dirty: draft !== original,
    canSave: draft !== original && valid && currentOk,
    save: async () => {
      await adminApi.changeAdminPin(unrecoverable ? typedCurrent : original, draft)
      setTypedCurrent("")
      await current.reload()
    },
  }
}
