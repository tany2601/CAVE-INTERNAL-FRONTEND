import { EmptyNote } from "../../../components/ui"
import { useState } from "react"
import {
  Building2,
  ImagePlus,
  Pencil,
  Plus,
  Power,
  Save,
} from "lucide-react"
import { Input, PhoneInput } from "../../../components/ui"
import { isValidPhone, sanitizePhone } from "../../../lib/phone"
import { adminApi } from "../../../lib/api"
import { useAsyncData } from "../../../hooks/useAsyncData"
import { useImageUpload } from "../../../hooks/useImageUpload"
import type { ApiBranch, ApiStaff } from "../../../types/api"
import { formatMoney } from "../adminTypes"
import { AdminModal, AdminSelect, AsyncNotice, PageHeading, CompactMetric, Field, StatusBadge } from "../components"
import { useAdminActions } from "../hooks/useAdminActions"

interface BranchForm {
  id?: string
  name: string
  code: string
  location: string
  city: string
  state: string
  phone: string
  target: number
  image: string | null
  manager: string // staff id, "" = unassigned
  managerPin: string
  stylistPin: string
}

const emptyForm: BranchForm = {
  name: "",
  code: "",
  location: "",
  city: "",
  state: "",
  phone: "",
  target: 0,
  image: null,
  manager: "",
  managerPin: "",
  stylistPin: "",
}

const toCode = (name: string) =>
  name.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 20)

const location = (b: ApiBranch) =>
  [b.address, b.city, b.state].filter(Boolean).join(", ") || "No address added"

export function BranchManagementView() {
  const actions = useAdminActions()
  const { data, loading, error, reload } = useAsyncData(async () => {
    const [branches, staff, overview] = await Promise.all([
      adminApi.listBranches(),
      adminApi.listStaff({ isActive: true }),
      adminApi.getOverview({ period: "TODAY" }),
    ])
    return { branches, staff, overview }
  })
  const [editing, setEditing] = useState<BranchForm | undefined>()
  const [codeTouched, setCodeTouched] = useState(false)
  const photo = useImageUpload("branches")

  const branches = data?.branches ?? []
  const staffOf = (branchId: string): ApiStaff[] =>
    (data?.staff ?? []).filter((s) => s.branchId === branchId)
  const today = (branchId: string) =>
    data?.overview.branches.find((b) => b.id === branchId)

  const pinsValid = (form: BranchForm) =>
    (form.managerPin === "" || /^\d{4}$/.test(form.managerPin)) &&
    (form.stylistPin === "" || /^\d{4}$/.test(form.stylistPin))
  const canSave = (form: BranchForm) =>
    !!form.name &&
    !!form.code &&
    !!form.location &&
    (form.phone === "" || isValidPhone(form.phone)) &&
    pinsValid(form) &&
    !photo.uploading &&
    (!!form.id || (form.managerPin !== "" && form.stylistPin !== ""))

  const save = async (form: BranchForm) => {
    const fields = {
      name: form.name.trim(),
      code: form.code.trim(),
      address: form.location.trim(),
      city: form.city.trim() || undefined,
      state: form.state.trim() || undefined,
      phone: form.phone.trim() || undefined,
      imageUrl: form.image ?? undefined,
      monthlyTarget: form.target,
      // Saved in the same request as the branch, so a rejected PIN (e.g. already in use)
      // leaves nothing behind.
      managerPin: form.managerPin || undefined,
      stylistPin: form.stylistPin || undefined,
    }
    if (form.id) {
      await adminApi.updateBranch(form.id, { ...fields, managerId: form.manager || null })
    } else {
      await adminApi.createBranch(fields)
    }
    setEditing(undefined)
    await reload()
  }

  const update = (patch: Partial<BranchForm>) =>
    setEditing((current) => (current ? { ...current, ...patch } : current))

  return (
    <div className="branch-management-page admin-photo-page min-h-full">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-7">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <PageHeading
            eyebrow="Branches"
            title="Branches"
            description="Add branches, set their PINs and targets, and manage each location."
          />
          <button
            className="admin-primary-button"
            onClick={() => {
              setCodeTouched(false)
              setEditing({ ...emptyForm })
            }}
          >
            <Plus size={15} /> Add branch
          </button>
        </div>

        <AsyncNotice loading={loading && !data} error={error} onRetry={reload} />

        {data && branches.length === 0 && (
          <EmptyNote className="mt-7">No branches yet. Add the first one above.</EmptyNote>
        )}
        <div className="branch-management-grid mt-7">
          {branches.map((branch, index) => {
            const staff = staffOf(branch.id)
            const manager =
              staff.find((s) => s.id === branch.managerId) ??
              staff.find((s) => s.role.name === "MANAGER")
            const pulse = today(branch.id)
            return (
              <article key={branch.id} className="branch-management-card">
                <div
                  className="branch-management-photo relative overflow-hidden"
                  data-index={index}
                >
                  {branch.imageUrl && (
                    <img
                      className="absolute inset-0 h-full w-full object-cover opacity-70"
                      src={branch.imageUrl}
                      alt={`${branch.name} branch`}
                    />
                  )}
                  <span className="relative z-10">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <Building2 className="relative z-10" size={24} />
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-display font-800 text-2xl uppercase tracking-wider">
                        {branch.name}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-1">
                        {location(branch)}
                      </div>
                      {branch.phone && (
                        <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                          {branch.phone}
                        </div>
                      )}
                    </div>
                    <StatusBadge
                      label={branch.isActive ? "Active" : "Inactive"}
                      tone={branch.isActive ? "success" : "danger"}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-5">
                    <CompactMetric label="Manager" value={manager?.name ?? "Unassigned"} />
                    <CompactMetric
                      label="Monthly target"
                      value={formatMoney(branch.monthlyTarget)}
                    />
                    <CompactMetric
                      label="Customers today"
                      value={String(pulse?.customers ?? 0)}
                    />
                    <CompactMetric
                      label="Active now"
                      value={String(pulse?.active ?? 0)}
                    />
                  </div>
                  <div className="flex gap-2 mt-5">
                    <button
                      className="admin-secondary-button flex-1"
                      onClick={() => {
                        setCodeTouched(true)
                        setEditing({
                          id: branch.id,
                          name: branch.name,
                          code: branch.code,
                          location: branch.address ?? "",
                          city: branch.city ?? "",
                          state: branch.state ?? "",
                          phone: sanitizePhone(branch.phone ?? ""),
                          target: branch.monthlyTarget,
                          image: branch.imageUrl,
                          manager: branch.managerId ?? "",
                          managerPin: "",
                          stylistPin: "",
                        })
                      }}
                    >
                      <Pencil size={14} /> Modify
                    </button>
                    <button
                      className="admin-danger-icon"
                      aria-label={`${branch.isActive ? "Deactivate" : "Reactivate"} ${branch.name}`}
                      onClick={() =>
                        actions.request({
                          title: `${branch.isActive ? "Deactivate" : "Reactivate"} ${branch.name} branch?`,
                          message: branch.isActive
                            ? "Staff at this branch will no longer be able to log in. Historic data is kept."
                            : "Staff at this branch will be able to log in again.",
                          confirmLabel: branch.isActive ? "Deactivate branch" : "Reactivate branch",
                          destructive: branch.isActive,
                          action: async () => {
                            await adminApi.setBranchStatus(branch.id, !branch.isActive)
                            await reload()
                          },
                          successMessage: `${branch.name} ${branch.isActive ? "deactivated" : "reactivated"}`,
                        })
                      }
                    >
                      <Power size={15} />
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>

      {editing && (
        <AdminModal
          title={editing.id ? "Modify branch" : "Add branch"}
          onClose={() => setEditing(undefined)}
        >
          <label className="relative mb-4 flex min-h-32 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-[var(--border)]">
            {editing.image ? (
              <img
                className="absolute inset-0 h-full w-full object-cover"
                src={editing.image}
                alt="Branch preview"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-[var(--text-muted)]">
                <ImagePlus size={22} />
                <span>{photo.uploading ? "Uploading…" : "Add branch image"}</span>
              </div>
            )}
            <Input
              className="hidden"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={async (event) => {
                const image = await photo.upload(event.target.files?.[0])
                if (image) update({ image })
              }}
            />
          </label>
          {photo.error && (
            <div className="mb-3 text-xs text-[#E06060]">{photo.error}</div>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Branch name">
              <input
                className="admin-input w-full"
                value={editing.name}
                onChange={(event) => {
                  const name = event.target.value
                  update({ name, ...(codeTouched ? {} : { code: toCode(name) }) })
                }}
                placeholder="e.g. Mangalore"
              />
            </Field>
            <Field label="Branch code">
              <input
                className="admin-input w-full"
                value={editing.code}
                onChange={(event) => {
                  setCodeTouched(true)
                  update({ code: event.target.value.toUpperCase() })
                }}
                placeholder="e.g. MANGALORE"
              />
            </Field>
            <Field label="Location">
              <input
                className="admin-input w-full"
                value={editing.location}
                onChange={(event) => update({ location: event.target.value })}
                placeholder="Area, city"
              />
            </Field>
            <Field label="City">
              <input
                className="admin-input w-full"
                value={editing.city}
                onChange={(event) => update({ city: event.target.value })}
                placeholder="City"
              />
            </Field>
            <Field label="State">
              <input
                className="admin-input w-full"
                value={editing.state}
                onChange={(event) => update({ state: event.target.value })}
                placeholder="State"
              />
            </Field>
            <Field label="Phone">
              <PhoneInput
                className="admin-input w-full"
                value={editing.phone}
                onChange={(phone) => update({ phone })}
                placeholder="10-digit mobile number"
              />
            </Field>
            <Field label="Monthly target">
              <input
                className="admin-input w-full"
                value={editing.target}
                inputMode="numeric"
                onChange={(event) =>
                  update({ target: Number(event.target.value.replace(/\D/g, "")) })
                }
              />
            </Field>
            <Field label="Manager">
              <AdminSelect
                value={
                  staffOf(editing.id ?? "").find((s) => s.id === editing.manager)?.name ??
                  "Unassigned"
                }
                onChange={(value) =>
                  update({
                    manager:
                      staffOf(editing.id ?? "").find((s) => s.name === value)?.id ?? "",
                  })
                }
                options={[
                  "Unassigned",
                  ...staffOf(editing.id ?? "")
                    .filter((s) => s.role.name === "MANAGER")
                    .map((s) => s.name),
                ]}
                full
              />
            </Field>
            <Field label={editing.id ? "New manager PIN (optional)" : "Manager PIN"}>
              <input
                className="admin-input w-full"
                value={editing.managerPin}
                inputMode="numeric"
                maxLength={4}
                onChange={(event) =>
                  update({ managerPin: event.target.value.replace(/\D/g, "").slice(0, 4) })
                }
                placeholder="4 digits"
              />
            </Field>
            <Field label={editing.id ? "New stylist PIN (optional)" : "Stylist PIN"}>
              <input
                className="admin-input w-full"
                value={editing.stylistPin}
                inputMode="numeric"
                maxLength={4}
                onChange={(event) =>
                  update({ stylistPin: event.target.value.replace(/\D/g, "").slice(0, 4) })
                }
                placeholder="4 digits"
              />
            </Field>
          </div>
          <button
            className="admin-primary-button w-full mt-5"
            disabled={!canSave(editing)}
            onClick={() =>
              actions.request({
                title: editing.id ? "Save branch changes?" : "Add this branch?",
                message: `${editing.name} will be ${
                  editing.id ? "updated in" : "added to"
                } the branch network.`,
                confirmLabel: editing.id ? "Save changes" : "Add branch",
                action: () => save(editing),
                successMessage: editing.id
                  ? "Branch updated successfully"
                  : "Branch added successfully",
              })
            }
          >
            <Save size={15} /> Save branch
          </button>
        </AdminModal>
      )}
      {actions.feedback}
    </div>
  )
}
