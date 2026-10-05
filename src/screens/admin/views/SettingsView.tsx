import { useState } from "react"
import {
  Check,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-react"
import { Button, Input } from "../../../components/ui"
import { adminApi } from "../../../lib/api"
import { useAsyncData } from "../../../hooks/useAsyncData"
import { useAdminPinEditor, useRolePinEditor } from "../../../hooks/usePinEditors"
import { PageHeading, Field, AdminSelect } from "../components"
import { useAdminActions } from "../hooks/useAdminActions"

/** PIN field that masks the digits until the eye is pressed. */
function SecretPinInput({
  value,
  onChange,
  length,
  placeholder,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  length: number
  placeholder: string
  disabled?: boolean
}) {
  const [shown, setShown] = useState(false)
  return (
    <div className="relative">
      <input
        className="admin-input w-full pr-11"
        type={shown ? "text" : "password"}
        inputMode="numeric"
        autoComplete="off"
        maxLength={length}
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
        aria-label={shown ? "Hide PIN" : "Show PIN"}
        onClick={() => setShown((v) => !v)}
      >
        {shown ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}

export const SettingsView = () => {
  const actions = useAdminActions()
  const { data: branches = [] } = useAsyncData(() => adminApi.listBranches({ isActive: true }))
  const managerPin = useRolePinEditor(branches, "MANAGER")
  const stylistPin = useRolePinEditor(branches, "STYLIST")
  const adminPin = useAdminPinEditor()
  const branchName = (id: string) => branches.find((b) => b.id === id)?.name ?? ""
  const checklistState = useAsyncData(() => adminApi.listChecklist())
  const checklist = (checklistState.data ?? []).map((t) => ({ id: t.id, text: t.task }))
  const [draft, setDraft] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState("")

  return (
    <div className="settings-page admin-photo-page min-h-full">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-7">
        <PageHeading
          eyebrow="Checklist and access"
          title="Settings"
          description="Manage the daily checklist and the PINs used to sign in."
        />

        <div className="settings-bento mt-7">
          <section className="settings-panel settings-checklist">
            <div className="settings-panel-number">01</div>
            <div>
              <div className="font-display font-800 text-2xl tracking-wider uppercase">
                Daily cleaning checklist
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1">
                Tasks shown to managers and stylists every day.
              </div>
            </div>
            <div className="mt-5 grid min-h-12 grid-cols-[minmax(0,1fr)_auto] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]">
              <Input
                className="h-full rounded-none border-0 bg-transparent"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Type a new cleaning task"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && draft.trim()) {
                    event.preventDefault()
                    actions.request({
                      title: "Add checklist item?",
                      message: `Add “${draft.trim()}” to the manager cleaning checklist?`,
                      confirmLabel: "Add item",
                      action: async () => {
                        await adminApi.createChecklistTask(draft.trim())
                        setDraft("")
                        await checklistState.reload()
                      },
                      successMessage: "Checklist item added",
                    })
                  }
                }}
              />
              <Button
                size="sm"
                className="h-full rounded-none"
                disabled={!draft.trim()}
                onClick={() =>
                  actions.request({
                    title: "Add checklist item?",
                    message: `Add “${draft.trim()}” to the manager cleaning checklist?`,
                    confirmLabel: "Add item",
                    action: async () => {
                      await adminApi.createChecklistTask(draft.trim())
                      setDraft("")
                      await checklistState.reload()
                    },
                    successMessage: "Checklist item added",
                  })
                }
              >
                <Plus size={15} /> Add
              </Button>
            </div>

            <div className="mt-3 flex min-h-12 flex-col items-start justify-between gap-3 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center">
              <span>
                {selected.length
                  ? `${selected.length} selected`
                  : `${checklist.length} checklist items`}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={!selected.length}
                  onClick={() =>
                    actions.request({
                      title: `Delete ${selected.length} selected item${
                        selected.length === 1 ? "" : "s"
                      }?`,
                      message:
                        "This removes the selected tasks from every manager checklist.",
                      confirmLabel: "Delete selected",
                      destructive: true,
                      action: async () => {
                        await Promise.all(
                          selected.map((id) => adminApi.deleteChecklistTask(id)),
                        )
                        setSelected([])
                        await checklistState.reload()
                      },
                      successMessage: "Selected checklist items deleted",
                    })
                  }
                >
                  Delete selected
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={!checklist.length}
                  onClick={() =>
                    actions.request({
                      title: "Clear the entire checklist?",
                      message:
                        "All cleaning tasks will be removed. This cannot be undone.",
                      confirmLabel: "Clear all",
                      destructive: true,
                      action: async () => {
                        await Promise.all(
                          checklist.map((item) => adminApi.deleteChecklistTask(item.id)),
                        )
                        setSelected([])
                        await checklistState.reload()
                      },
                      successMessage: "Checklist cleared",
                    })
                  }
                >
                  Clear all
                </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)]">
              {checklist.map((item, index) => {
                const checked = selected.includes(item.id)
                const editing = editingId === item.id
                return (
                  <div
                    key={item.id}
                    className="flex min-h-16 items-center gap-2.5 border-b border-[var(--border-subtle)] bg-[var(--surface-soft)] p-2"
                  >
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      aria-label={`Select ${item.text}`}
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors ${
                        checked
                          ? "border-[#3D6FA8] bg-[#3D6FA8] text-white"
                          : "border-[var(--border)] bg-transparent text-transparent"
                      }`}
                      onClick={() =>
                        setSelected((current) =>
                          checked
                            ? current.filter((id) => id !== item.id)
                            : [...current, item.id],
                        )
                      }
                    >
                      <Check size={15} strokeWidth={3} />
                    </button>
                    <span className="hidden shrink-0 font-display font-700 text-[var(--text-faint)] sm:inline">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {editing ? (
                      <div className="min-w-0 flex-1">
                        <Input
                          className="h-10"
                          value={editingText}
                          onChange={(event) => setEditingText(event.target.value)}
                        />
                      </div>
                    ) : (
                      <span className="min-w-0 flex-1 break-words text-sm">{item.text}</span>
                    )}
                    <Button
                      size="icon"
                      variant="outline"
                      aria-label={editing ? "Save edit" : `Edit ${item.text}`}
                      onClick={() => {
                        if (!editing) {
                          setEditingId(item.id)
                          setEditingText(item.text)
                          return
                        }
                        actions.request({
                          title: "Save checklist changes?",
                          message: `Update this task to “${editingText.trim()}”?`,
                          confirmLabel: "Save changes",
                          action: async () => {
                            await adminApi.updateChecklistTask(item.id, {
                              task: editingText.trim(),
                            })
                            setEditingId(null)
                            await checklistState.reload()
                          },
                          successMessage: "Checklist item updated",
                        })
                      }}
                    >
                      {editing ? <Save size={18} /> : <Pencil size={18} />}
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      aria-label={`Delete ${item.text}`}
                      onClick={() =>
                        actions.request({
                          title: "Delete checklist item?",
                          message: `Remove “${item.text}” from the checklist?`,
                          confirmLabel: "Delete item",
                          destructive: true,
                          action: async () => {
                            await adminApi.deleteChecklistTask(item.id)
                            await checklistState.reload()
                          },
                          successMessage: "Checklist item deleted",
                        })
                      }
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                )
              })}
              {checklistState.error && (
                <div className="py-10 text-center text-xs text-[#E06060]">
                  {checklistState.error}
                </div>
              )}
              {!checklist.length && !checklistState.error && (
                <div className="py-10 text-center text-xs text-[var(--text-muted)]">
                  {checklistState.loading
                    ? "Loading tasks…"
                    : "No cleaning tasks yet. Add the first item above."}
                </div>
              )}
            </div>
          </section>

          <section className="settings-panel settings-manager-pins">
            <div className="settings-panel-number">02</div>
            <div className="font-display font-800 text-2xl tracking-wider uppercase">
              Manager access
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mt-5">
              <Field label="Branch">
                <AdminSelect
                  value={branchName(managerPin.branchId)}
                  onChange={(name) =>
                    managerPin.setBranchId(branches.find((b) => b.name === name)?.id ?? "")
                  }
                  options={branches.map((b) => b.name)}
                  full
                />
              </Field>
              <Field label="Manager PIN">
                <SecretPinInput
                  value={managerPin.draft}
                  onChange={managerPin.setDraft}
                  length={4}
                  disabled={managerPin.loading}
                  placeholder={
                    managerPin.unrecoverable
                      ? "Set a new PIN to view it here"
                      : managerPin.notConfigured
                        ? "Not set yet"
                        : "4-digit PIN"
                  }
                />
              </Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <Field label="Admin PIN">
                <SecretPinInput
                  value={adminPin.draft}
                  onChange={adminPin.setDraft}
                  length={6}
                  disabled={adminPin.loading}
                  placeholder={adminPin.unrecoverable ? "Enter a new 6-digit PIN" : "6-digit PIN"}
                />
              </Field>
              {adminPin.unrecoverable && (
                <Field label="Current admin PIN">
                  <input
                    className="admin-input w-full"
                    type="password"
                    placeholder="Needed once to change it"
                    inputMode="numeric"
                    maxLength={6}
                    value={adminPin.typedCurrent}
                    onChange={(event) => adminPin.setTypedCurrent(event.target.value)}
                  />
                </Field>
              )}
            </div>
            <button
              className="admin-primary-button mt-4"
              disabled={!managerPin.canSave && !adminPin.canSave}
              onClick={() =>
                actions.request({
                  title: "Save manager and Admin PINs?",
                  message: `${
                    managerPin.canSave ? `The ${branchName(managerPin.branchId)} manager PIN` : ""
                  }${managerPin.canSave && adminPin.canSave ? " and " : ""}${
                    adminPin.canSave ? "the Admin PIN" : ""
                  } will change for future sign-ins.`,
                  confirmLabel: "Save PINs",
                  action: async () => {
                    if (managerPin.canSave) await managerPin.save()
                    if (adminPin.canSave) await adminPin.save()
                  },
                  successMessage: "PINs updated",
                })
              }
            >
              <Save size={15} /> Save access PINs
            </button>
          </section>

          <section className="settings-panel settings-branch-pins">
            <div className="settings-panel-number">03</div>
            <div className="font-display font-800 text-2xl tracking-wider uppercase">
              Stylist branch PINs
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mt-5">
              <Field label="Branch">
                <AdminSelect
                  value={branchName(stylistPin.branchId)}
                  onChange={(name) =>
                    stylistPin.setBranchId(branches.find((b) => b.name === name)?.id ?? "")
                  }
                  options={branches.map((b) => b.name)}
                  full
                />
              </Field>
              <Field label="Stylist PIN">
                <SecretPinInput
                  value={stylistPin.draft}
                  onChange={stylistPin.setDraft}
                  length={4}
                  disabled={stylistPin.loading}
                  placeholder={
                    stylistPin.unrecoverable
                      ? "Set a new PIN to view it here"
                      : stylistPin.notConfigured
                        ? "Not set yet"
                        : "4-digit PIN"
                  }
                />
              </Field>
            </div>
            <button
              className="admin-primary-button mt-4"
              disabled={!stylistPin.canSave}
              onClick={() =>
                actions.request({
                  title: "Save branch PIN?",
                  message: `The stylist access PIN for ${branchName(stylistPin.branchId)} will be updated.`,
                  confirmLabel: "Save PIN",
                  action: () => stylistPin.save(),
                  successMessage: "Branch PIN updated",
                })
              }
            >
              <Save size={15} /> Save branch PIN
            </button>
          </section>

        </div>
      </div>

      {actions.feedback}
    </div>
  )
}
