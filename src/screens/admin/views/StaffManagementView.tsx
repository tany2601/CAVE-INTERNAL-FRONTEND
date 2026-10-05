import { useState } from "react"
import {
  ImagePlus,
  Pencil,
  Save,
  UserPlus,
} from "lucide-react"
import { Button, Input, PhoneInput } from "../../../components/ui"
import { isValidPhone, sanitizePhone } from "../../../lib/phone"
import { isValidPersonName, sanitizePersonName } from "../../../lib/names"
import { adminApi } from "../../../lib/api"
import { useAsyncData } from "../../../hooks/useAsyncData"
import { useImageUpload } from "../../../hooks/useImageUpload"
import type { ApiBranch, ApiCommissionModel, ApiRoleRef, ApiStaff } from "../../../types/api"
import { formatMoney } from "../adminTypes"
import { AdminModal, AsyncNotice, PageHeading, AdminSelect, Field, StatusBadge, ViewMoreButton } from "../components"
import { useAdminActions } from "../hooks/useAdminActions"

const MODEL_LABELS: Record<ApiCommissionModel, string> = {
  FLAT_PERCENTAGE: "Flat %",
  DAILY_TARGET: "Daily Target",
  MONTHLY_TARGET: "Monthly Target",
}
const MODEL_BY_LABEL = Object.fromEntries(
  Object.entries(MODEL_LABELS).map(([k, v]) => [v, k]),
) as Record<string, ApiCommissionModel>

const num = (v: number | string | null | undefined) =>
  v === null || v === undefined || v === "" ? 0 : Number(v)

const commissionSummary = (s: ApiStaff) => {
  if (s.role.name !== "STYLIST" || !s.commissionModel) return null
  if (s.commissionModel === "FLAT_PERCENTAGE")
    return `Flat ${num(s.flatCommissionPercentage)}%`
  if (s.commissionModel === "DAILY_TARGET")
    return `Daily target ${formatMoney(num(s.dailyTargetAmount))}`
  return "Monthly slabs"
}

export function StaffManagementView() {
  const actions = useAdminActions()
  const { data, loading, error, reload } = useAsyncData(async () => {
    const [staff, branches, roles] = await Promise.all([
      adminApi.listStaff(),
      adminApi.listBranches(),
      adminApi.listRoles(),
    ])
    return { staff, branches, roles }
  })
  const [staffModal, setStaffModal] = useState<{
    mode: "add" | "edit"
    staff?: ApiStaff
  } | null>(null)
  const [limit, setLimit] = useState(5)
  const [branch, setBranch] = useState("All Branches")

  const staff = data?.staff ?? []
  const branches = data?.branches ?? []
  const visibleStaff =
    branch === "All Branches"
      ? staff
      : staff.filter((item) => item.branch?.name === branch)

  return (
    <div className="staff-page admin-photo-page min-h-full">
      <div className="max-w-[1350px] mx-auto px-4 sm:px-6 lg:px-8 py-7">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <PageHeading
            eyebrow="Employees"
            title="Manager / staff management"
            description="Add, edit or deactivate managers and stylists."
          />
          <button
            className="admin-primary-button"
            disabled={!data}
            onClick={() => setStaffModal({ mode: "add" })}
          >
            <UserPlus size={15} /> Add staff
          </button>
        </div>
        <div className="mt-6 max-w-56">
          <AdminSelect
            value={branch}
            onChange={(value) => {
              setBranch(value)
              setLimit(5)
            }}
            options={["All Branches", ...branches.map((b) => b.name)]}
            full
          />
        </div>
        <AsyncNotice loading={loading && !data} error={error} onRetry={reload} />
        <div className="staff-directory mt-4">
          {visibleStaff.slice(0, limit).map((item, index) => (
            <article key={item.id} className="staff-directory-row">
              <span className="staff-directory-index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="w-12 h-12 rounded-2xl bg-[var(--elevated)] flex items-center justify-center font-display font-800 overflow-hidden">
                {item.photoUrl ? (
                  <img
                    className="h-full w-full object-cover"
                    src={item.photoUrl}
                    alt={item.name}
                  />
                ) : (
                  item.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-800 text-xl uppercase tracking-wider">
                  {item.name}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  {item.branch?.name ?? "No branch"} ·{" "}
                  {item.role.name === "MANAGER" ? "Manager" : "Stylist"}
                  {item.phone && ` · ${item.phone}`}
                  {item.dailyRevenueTarget
                    ? ` · Daily ${formatMoney(num(item.dailyRevenueTarget))}`
                    : ""}
                  {commissionSummary(item) && ` · ${commissionSummary(item)}`} ·
                  Salary {formatMoney(num(item.monthlySalary))}
                </div>
              </div>
              <StatusBadge
                label={item.isActive ? "Active" : "Inactive"}
                tone={item.isActive ? "success" : "danger"}
              />
              <button
                className="admin-icon-button"
                aria-label={`Edit ${item.name}`}
                onClick={() => setStaffModal({ mode: "edit", staff: item })}
              >
                <Pencil size={14} />
              </button>
              <Button
                size="sm"
                className="staff-deactivate min-w-[7.5rem]"
                variant={item.isActive ? "destructive" : "secondary"}
                onClick={() =>
                  actions.request({
                    title: `${item.isActive ? "Deactivate" : "Reactivate"} ${item.name}?`,
                    message: item.isActive
                      ? "The employee will lose access but their historic sessions and payroll records will remain."
                      : "The employee will appear in stylist selection again.",
                    confirmLabel: item.isActive ? "Deactivate" : "Reactivate",
                    destructive: item.isActive,
                    action: async () => {
                      await adminApi.setStaffStatus(item.id, !item.isActive)
                      await reload()
                    },
                    successMessage: `${item.name} ${item.isActive ? "deactivated" : "reactivated"}`,
                  })
                }
              >
                {item.isActive ? "Deactivate" : "Reactivate"}
              </Button>
            </article>
          ))}
        </div>
        {!loading && !error && visibleStaff.length === 0 && (
          <div className="mt-6 text-center text-xs text-[var(--text-muted)]">
            No staff found.
          </div>
        )}
        {visibleStaff.length > limit && (
          <ViewMoreButton onClick={() => setLimit((value) => value + 5)} />
        )}
      </div>
      {staffModal && data && (
        <StaffModal
          data={staffModal}
          branches={branches}
          roles={data.roles}
          onClose={() => setStaffModal(null)}
          onSave={(input, summary) =>
            actions.request({
              title:
                staffModal.mode === "edit"
                  ? "Save employee changes?"
                  : `Add this ${summary.type.toLowerCase()}?`,
              message: `${summary.name || "This employee"} will be assigned to ${
                summary.branch
              }.`,
              confirmLabel:
                staffModal.mode === "edit" ? "Save changes" : "Add employee",
              action: async () => {
                if (staffModal.staff) await adminApi.updateStaff(staffModal.staff.id, input)
                else await adminApi.createStaff(input)
                setStaffModal(null)
                await reload()
              },
              successMessage:
                staffModal.mode === "edit"
                  ? "Employee details updated"
                  : `${summary.type} added successfully`,
            })
          }
        />
      )}
      {actions.feedback}
    </div>
  )
}

function StaffModal({
  data,
  branches,
  roles,
  onClose,
  onSave,
}: {
  data: { mode: "add" | "edit"; staff?: ApiStaff }
  branches: ApiBranch[]
  roles: ApiRoleRef[]
  onClose: () => void
  onSave: (
    input: adminApi.StaffInput,
    summary: { type: string; name: string; branch: string },
  ) => void
}) {
  const existing = data.staff
  const [employeeType, setEmployeeType] = useState(
    existing?.role.name === "MANAGER" ? "Manager" : "Stylist",
  )
  const [model, setModel] = useState(
    existing?.commissionModel ? MODEL_LABELS[existing.commissionModel] : "Flat %",
  )
  const [name, setName] = useState(existing?.name ?? "")
  const [branchId, setBranchId] = useState(existing?.branchId ?? branches[0]?.id ?? "")
  const [phone, setPhone] = useState(sanitizePhone(existing?.phone ?? ""))
  const [photo, setPhoto] = useState<string | null>(existing?.photoUrl ?? null)
  const photoUpload = useImageUpload("staff")
  const [daily, setDaily] = useState(
    existing?.dailyRevenueTarget != null ? String(num(existing.dailyRevenueTarget)) : "",
  )
  const [target, setTarget] = useState(
    existing?.monthlyRevenueTarget != null ? String(num(existing.monthlyRevenueTarget)) : "",
  )
  const [flat, setFlat] = useState(
    existing?.flatCommissionPercentage != null ? String(num(existing.flatCommissionPercentage)) : "",
  )
  const [slabs, setSlabs] = useState(
    [1, 2, 3].map((order) => {
      const slab = existing?.commissionSlabs.find((s) => s.slabOrder === order)
      return {
        min: slab ? String(num(slab.minRevenue)) : "",
        pct: slab ? String(num(slab.commissionPercentage)) : "",
      }
    }),
  )
  const [salary, setSalary] = useState(
    existing?.monthlySalary != null ? String(num(existing.monthlySalary)) : "",
  )

  const isStylist = employeeType === "Stylist"
  const modelKey = MODEL_BY_LABEL[model]
  const commissionValid =
    !isStylist ||
    (modelKey === "FLAT_PERCENTAGE" && flat !== "" && Number(flat) <= 100) ||
    (modelKey === "DAILY_TARGET" && daily !== "") ||
    (modelKey === "MONTHLY_TARGET" &&
      slabs.every((s) => s.min !== "" && s.pct !== "" && Number(s.pct) <= 100))
  const roleId = roles.find((r) => r.name === employeeType.toUpperCase())?.id
  const branchName = branches.find((b) => b.id === branchId)?.name ?? ""

  const buildInput = (): adminApi.StaffInput => ({
    name: name.trim(),
    roleId: roleId as string,
    branchId,
    ...(salary !== "" ? { monthlySalary: Number(salary) } : {}),
    phone: phone.trim(),
    ...(photo ? { photoUrl: photo } : {}),
    ...(isStylist && daily !== "" ? { dailyRevenueTarget: Number(daily) } : {}),
    ...(isStylist && target !== "" ? { monthlyRevenueTarget: Number(target) } : {}),
    ...(isStylist
      ? {
          commissionModel: modelKey,
          ...(modelKey === "FLAT_PERCENTAGE"
            ? { flatCommissionPercentage: Number(flat) }
            : modelKey === "DAILY_TARGET"
              ? { dailyTargetAmount: Number(daily) }
              : {
                  commissionSlabs: slabs.map((s, i) => ({
                    slabOrder: i + 1,
                    minRevenue: Number(s.min),
                    commissionPercentage: Number(s.pct),
                  })),
                }),
        }
      : {}),
  })

  return (
    <AdminModal
      title={data.mode === "edit" ? "Edit employee" : "Add employee"}
      onClose={onClose}
    >
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-soft)] p-1">
        {["Stylist", "Manager"].map((type) => (
          <Button
            size="sm"
            variant={employeeType === type ? "primary" : "ghost"}
            key={type}
            onClick={() => setEmployeeType(type)}
          >
            {type}
          </Button>
        ))}
      </div>
      <label className="mb-4 flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[var(--border)] p-3 text-[var(--text-muted)]">
        {photo ? (
          <img
            className="h-12 w-12 rounded-xl object-cover"
            src={photo}
            alt="Employee preview"
          />
        ) : (
          <ImagePlus size={22} />
        )}
        <div>
          <strong>Photo</strong>
          <span>
            {photoUpload.uploading ? " Uploading…" : "Optional · JPG or PNG"}
          </span>
        </div>
        <Input
          className="hidden"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={async (event) => {
            const url = await photoUpload.upload(event.target.files?.[0])
            if (url) setPhoto(url)
          }}
        />
      </label>
      {photoUpload.error && (
        <div className="mb-3 text-xs text-[#E06060]">{photoUpload.error}</div>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Name">
          <input
            className="admin-input w-full"
            value={name}
            onChange={(event) => setName(sanitizePersonName(event.target.value))}
            placeholder="e.g. Waseem"
            maxLength={100}
          />
        </Field>
        <Field label="Phone number">
          <PhoneInput
            className="w-full h-14 px-4 bg-[var(--surface)] border border-[var(--border)] rounded-sm text-[var(--text)] text-base placeholder-[var(--text-faint)] outline-none focus:border-[#3D6FA8] transition-colors"
            value={phone}
            onChange={setPhone}
          />
        </Field>
        <Field label="Branch">
          <AdminSelect
            value={branchName}
            onChange={(value) =>
              setBranchId(branches.find((b) => b.name === value)?.id ?? branchId)
            }
            options={branches.map((b) => b.name)}
            full
          />
        </Field>
        {isStylist && (
          <Field label="Commission model">
            <AdminSelect
              value={model}
              onChange={setModel}
              options={Object.values(MODEL_LABELS)}
              full
            />
          </Field>
        )}
        {isStylist && modelKey === "FLAT_PERCENTAGE" && (
          <Field label="Commission %">
            <Input
              value={flat}
              onChange={(event) => setFlat(event.target.value.replace(/[^\d.]/g, ""))}
              placeholder="e.g. 10"
              inputMode="decimal"
            />
          </Field>
        )}
        {isStylist && (
          <Field label="Daily target">
            <Input
              value={daily}
              onChange={(event) => setDaily(event.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 900"
              inputMode="numeric"
            />
          </Field>
        )}
        {isStylist && (
          <Field label="Target">
            <Input
              value={target}
              onChange={(event) => setTarget(event.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 25000"
              inputMode="numeric"
            />
          </Field>
        )}
        <Field label="Monthly salary">
          <Input
            value={salary}
            onChange={(event) => setSalary(event.target.value.replace(/\D/g, ""))}
            placeholder="e.g. 19500"
            inputMode="numeric"
          />
        </Field>
      </div>
      {isStylist && modelKey === "MONTHLY_TARGET" && (
        <div className="mt-3 grid gap-3">
          {slabs.map((slab, index) => (
            <div key={index} className="grid sm:grid-cols-2 gap-3">
              <Field label={`Slab ${index + 1} · minimum monthly revenue`}>
                <Input
                  value={slab.min}
                  onChange={(event) =>
                    setSlabs((current) =>
                      current.map((s, i) =>
                        i === index ? { ...s, min: event.target.value.replace(/\D/g, "") } : s,
                      ),
                    )
                  }
                  placeholder="e.g. 25000"
                  inputMode="numeric"
                />
              </Field>
              <Field label={`Slab ${index + 1} · commission %`}>
                <Input
                  value={slab.pct}
                  onChange={(event) =>
                    setSlabs((current) =>
                      current.map((s, i) =>
                        i === index ? { ...s, pct: event.target.value.replace(/[^\d.]/g, "") } : s,
                      ),
                    )
                  }
                  placeholder="e.g. 5"
                  inputMode="decimal"
                />
              </Field>
            </div>
          ))}
        </div>
      )}
      <Button
        fullWidth
        className="mt-5"
        disabled={
          !isValidPersonName(name, 2) ||
          !isValidPhone(phone) ||
          !branchId ||
          !roleId ||
          !commissionValid ||
          photoUpload.uploading
        }
        onClick={() =>
          onSave(buildInput(), { type: employeeType, name: name.trim(), branch: branchName })
        }
      >
        <Save size={15} /> {data.mode === "edit" ? "Save employee" : "Add employee"}
      </Button>
    </AdminModal>
  )
}
