import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Hand, ImageIcon, MessageCircle, MessageSquareText, Plus, Power, Send, Trash2, Zap } from "lucide-react"
import { adminApi } from "../../../lib/api"
import type { WhatsappMode } from "../../../lib/api/admin"
import { useAsyncData } from "../../../hooks/useAsyncData"
import { PhoneInput } from "../../../components/ui"
import { isValidPhone } from "../../../lib/phone"
import { useAdminActions } from "../hooks/useAdminActions"

const MAX_NUMBERS = 3

const MODES: { value: WhatsappMode; title: string; text: string; icon: typeof Power }[] = [
  { value: "off", title: "Off", text: "Bills are not sent on WhatsApp.", icon: Power },
  {
    value: "api",
    title: "Automatic",
    text: "Sent by the server the moment a bill closes (WhatsApp Business). Also sends the admin reports and offers.",
    icon: Zap,
  },
  {
    value: "manual",
    title: "Manual",
    text: "After billing, staff tap one button and WhatsApp opens with the customer's number and the bill typed in.",
    icon: Hand,
  },
]

const REPORTS = [
  { key: "daily", label: "Daily", when: "every night at 9:30 PM" },
  { key: "weekly", label: "Weekly", when: "Monday 9:00 AM, for the week just ended" },
  { key: "monthly", label: "Monthly", when: "the 1st at 9:00 AM, for the month just ended" },
] as const

type ReportKey = (typeof REPORTS)[number]["key"]

/** Today's date in India as YYYY-MM-DD (what the date fields and the server use). */
const todayIst = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })

const when = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })
    : "—"

/** Admin → Settings card: who gets the WhatsApp reports, which ones, a test button, and the recent message log. */
export function WhatsappPanel() {
  const actions = useAdminActions()
  const status = useAsyncData(() => adminApi.getWhatsapp())
  const log = useAsyncData(() => adminApi.listWhatsappMessages())
  const [phones, setPhones] = useState<string[]>([""])
  const [on, setOn] = useState<Record<ReportKey, boolean>>({ daily: true, weekly: true, monthly: true })
  const [mode, setMode] = useState<WhatsappMode>("off")
  const [billFormat, setBillFormat] = useState<"text" | "image">("text")
  const [dirty, setDirty] = useState(false)
  const [testing, setTesting] = useState(false)
  const [excel, setExcel] = useState(true)
  const [from, setFrom] = useState(todayIst)
  const [to, setTo] = useState(todayIst)
  const [downloading, setDownloading] = useState(false)
  const [reportNote, setReportNote] = useState<string | null>(null)
  const rangeOk = /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to) && from <= to

  // Fill the form from the server once, without overwriting what is being typed.
  const loaded = status.data
  useEffect(() => {
    if (!loaded || dirty) return
    setPhones(loaded.phones.length ? loaded.phones : [""])
    setOn({ daily: loaded.daily, weekly: loaded.weekly, monthly: loaded.monthly })
    setMode(loaded.mode)
    setBillFormat(loaded.billFormat)
    setExcel(loaded.excel)
  }, [loaded, dirty])

  const filled = phones.filter((p) => p !== "")
  const valid = filled.every(isValidPhone)
  const edit = (next: string[]) => {
    setPhones(next)
    setDirty(true)
  }

  const save = async () => {
    await adminApi.saveWhatsapp({ phones: filled, ...on, excel, mode, billFormat })
    setDirty(false)
    await status.reload()
  }

  return (
    <section className="settings-panel settings-whatsapp">
      <div className="settings-panel-number">04</div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-display font-800 text-2xl tracking-wider uppercase">WhatsApp</div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">
            Choose how customers receive their bill. Only one way can be on at a time, or turn both off.
          </div>
        </div>
        {loaded && (
          <span
            className={`inline-flex min-w-[7.5rem] items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-[10px] uppercase tracking-widest ${
              loaded.configured
                ? "border-[rgba(46,125,88,0.3)] bg-[rgba(46,125,88,0.1)] text-[#4CAF86]"
                : "border-[rgba(224,96,96,0.3)] bg-[rgba(224,96,96,0.1)] text-[#E06060]"
            }`}
          >
            {loaded.configured ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
            {loaded.configured ? "Connected" : "Not set up"}
          </span>
        )}
      </div>

      {loaded?.paused && (
        <div role="alert" className="mt-4 flex flex-wrap items-start gap-3 rounded-xl border border-[rgba(224,96,96,0.35)] bg-[rgba(224,96,96,0.08)] p-4">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-[#E06060]" />
          <div className="min-w-0 flex-1 basis-56">
            <div className="text-sm font-600 text-[#E06060]">
              {loaded.pausedScope === "offers" ? "Offers are paused" : "Sending is paused"}
            </div>
            <div className="mt-1 text-[11px] leading-snug text-[var(--text-secondary)]">{loaded.paused.reason}</div>
            <div className="mt-1 text-[10px] text-[var(--text-muted)]">
              Resumes by itself around {when(loaded.paused.until)}, or press Resume once it is fixed.
            </div>
          </div>
          <button
            className="admin-secondary-button h-9 whitespace-nowrap px-4 text-[0.65rem]"
            onClick={() =>
              actions.request({
                title: "Resume sending?",
                message: "Only do this after the cause is fixed. Resuming without fixing it can make WhatsApp restrict the number.",
                confirmLabel: "Resume",
                action: async () => {
                  await adminApi.resumeWhatsapp()
                  await status.reload()
                },
                successMessage: "Sending resumed",
              })
            }
          >
            Resume
          </button>
        </div>
      )}
      {loaded?.configured && !loaded.webhookReady && (
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3 text-[11px] leading-snug text-[var(--text-muted)]">
          Delivery ticks and STOP replies are off: the webhook is not set up yet (needs WHATSAPP_APP_SECRET and
          WHATSAPP_VERIFY_TOKEN on the server). Do this before sending offers to customers.
        </div>
      )}

      <div className="mt-5 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="How bills are sent">
        {MODES.map((m) => {
          const Icon = m.icon
          const active = mode === m.value
          return (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={active}
              className={`flex min-h-28 flex-col gap-2 rounded-xl border p-4 text-left transition-colors ${
                active
                  ? "border-[var(--text)] bg-[var(--elevated)]"
                  : "border-[var(--border-subtle)] bg-[var(--surface-soft)]"
              }`}
              onClick={() => {
                setMode(m.value)
                setDirty(true)
              }}
            >
              <span className="flex items-center justify-between">
                <Icon size={18} />
                <span
                  className={`h-4 w-4 rounded-full border ${active ? "border-[var(--text)] bg-[var(--text)]" : "border-[var(--border)]"}`}
                />
              </span>
              <span className="text-sm font-600">{m.title}</span>
              <span className="text-[11px] leading-snug text-[var(--text-muted)]">{m.text}</span>
            </button>
          )
        })}
      </div>

      {mode !== "off" && (
        <div className="mt-4">
          <div className="admin-kicker mb-2">Bill looks like</div>
          <div className="admin-segment w-fit max-w-full">
            {(
              [
                ["text", "Text message", MessageSquareText],
                ["image", "Picture with details", ImageIcon],
              ] as const
            ).map(([value, label, Icon]) => (
              <button
                key={value}
                className={billFormat === value ? "active" : ""}
                onClick={() => {
                  setBillFormat(value)
                  setDirty(true)
                }}
              >
                <span className="flex items-center gap-2">
                  <Icon size={14} /> {label}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-2 text-[11px] text-[var(--text-muted)]">
            {billFormat === "image"
              ? "The customer gets a branded bill picture (CAVE logo, thank-you, every line and the total) with the bill written under it."
              : "The customer gets the bill written out as a message."}
          </div>
        </div>
      )}

      {mode === "api" && loaded && !loaded.configured && (
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-xs leading-relaxed text-[var(--text-secondary)]">
          Automatic sending needs the WhatsApp Business keys on the server, and they are not added yet, so nothing is being
          sent (billing is not affected). Ask your developer to follow <b>docs/whatsapp-setup.md</b>, or choose Manual.
        </div>
      )}

      <div className={`mt-6 grid gap-6 lg:grid-cols-2 ${mode === "api" ? "" : "opacity-45"}`}>
        {mode !== "api" && (
          <div className="text-[11px] text-[var(--text-muted)] lg:col-span-2">
            Reports to your WhatsApp are sent through the Business API, so they need <b>Automatic</b>.
          </div>
        )}
        <div>
          <div className="admin-kicker mb-2">Send reports to</div>
          <div className="flex flex-col gap-2">
            {phones.map((phone, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <PhoneInput
                    value={phone}
                    onChange={(v) => edit(phones.map((p, i) => (i === index ? v : p)))}
                    placeholder="WhatsApp number (10 digits)"
                    className="admin-input w-full"
                  />
                </div>
                {phones.length > 1 && (
                  <button
                    className="admin-danger-icon shrink-0"
                    aria-label="Remove number"
                    onClick={() => edit(phones.filter((_, i) => i !== index))}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
            {phones.length < MAX_NUMBERS && (
              <button
                className="inline-flex h-10 w-fit items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)]"
                onClick={() => edit([...phones, ""])}
              >
                <Plus size={13} /> Add another number
              </button>
            )}
          </div>
        </div>

        <div>
          <div className="admin-kicker mb-2">Reports</div>
          <div className="flex flex-col gap-2">
            {REPORTS.map((r) => (
              <button
                key={r.key}
                type="button"
                role="switch"
                aria-checked={on[r.key]}
                className="flex min-h-14 items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-soft)] p-3 text-left"
                onClick={() => {
                  setOn({ ...on, [r.key]: !on[r.key] })
                  setDirty(true)
                }}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                    on[r.key] ? "border-[#3D6FA8] bg-[#3D6FA8] text-white" : "border-[var(--border)] text-transparent"
                  }`}
                >
                  <CheckCircle2 size={14} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-600">{r.label} report</span>
                  <span className="block text-[11px] text-[var(--text-muted)]">{r.when}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-soft)] p-4">
        <button
          type="button"
          role="checkbox"
          aria-checked={excel}
          className="flex w-full items-center gap-3 text-left"
          onClick={() => {
            setExcel(!excel)
            setDirty(true)
          }}
        >
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
              excel ? "border-[#3D6FA8] bg-[#3D6FA8] text-white" : "border-[var(--border)] text-transparent"
            }`}
          >
            <CheckCircle2 size={14} />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-2 text-sm font-600">
              <FileSpreadsheet size={15} /> Attach the full Excel report
            </span>
            <span className="block text-[11px] leading-snug text-[var(--text-muted)]">
              Every branch, customer, bill, service, product, stylist, expense and payout for the period, in one file. Needs the “
              {loaded?.templates.reportFile ?? "cave_report_file"}” template approved in WhatsApp.
            </span>
          </span>
        </button>

        <div className="admin-kicker mb-2 mt-5">Try a report</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-[var(--text-muted)]">From</span>
            <input
              type="date"
              className="admin-input w-full"
              value={from}
              max={todayIst()}
              onChange={(e) => {
                setFrom(e.target.value)
                if (e.target.value > to) setTo(e.target.value)
                setReportNote(null)
              }}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-[var(--text-muted)]">To</span>
            <input
              type="date"
              className="admin-input w-full"
              value={to}
              min={from}
              max={todayIst()}
              onChange={(e) => {
                setTo(e.target.value)
                setReportNote(null)
              }}
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            className="admin-secondary-button whitespace-nowrap px-5"
            disabled={downloading || !rangeOk}
            onClick={async () => {
              setDownloading(true)
              setReportNote(null)
              try {
                const blob = await adminApi.downloadWhatsappReport(from, to)
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = from === to ? `CAVE-report-${from}.xlsx` : `CAVE-report-${from}-to-${to}.xlsx`
                document.body.appendChild(a)
                a.click()
                a.remove()
                window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
                setReportNote("Downloaded. Nothing was sent on WhatsApp.")
              } catch (e) {
                setReportNote(e instanceof Error ? e.message : "Could not make the report.")
              } finally {
                setDownloading(false)
              }
            }}
          >
            <Download size={14} /> {downloading ? "Preparing…" : "Download Excel"}
          </button>
          <button
            className="admin-secondary-button whitespace-nowrap px-5"
            disabled={testing || dirty || !rangeOk || filled.length === 0 || !loaded?.configured || mode !== "api"}
            title={dirty ? "Save first" : mode !== "api" ? "Switch on Automatic first" : undefined}
            onClick={async () => {
              setTesting(true)
              setReportNote(null)
              try {
                await adminApi.testWhatsapp({ from, to })
                setReportNote("Queued. It shows under Recent messages in a moment.")
                window.setTimeout(() => void log.reload(), 2500)
              } catch (e) {
                setReportNote(e instanceof Error ? e.message : "Could not send the report.")
              } finally {
                setTesting(false)
              }
            }}
          >
            <Send size={14} /> {testing ? "Sending…" : "Send to WhatsApp"}
          </button>
        </div>
        {reportNote && <div className="mt-3 text-[11px] text-[var(--text-muted)]">{reportNote}</div>}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          className="admin-primary-button"
          disabled={!dirty || !valid}
          onClick={() =>
            actions.request({
              title: "Save WhatsApp settings?",
              message: `Bills: ${
                mode === "off"
                  ? "not sent on WhatsApp"
                  : `${mode === "api" ? "sent automatically" : "sent by hand from the staff app"}, as a ${billFormat === "image" ? "picture" : "text message"}`
              }. ${
                mode !== "api"
                  ? "Reports and offers are off."
                  : filled.length
                    ? `Reports go to ${filled.map((p) => `+91 ${p}`).join(", ")}.`
                    : "No report number is set, so no reports will be sent."
              }`,
              confirmLabel: "Save",
              action: save,
              successMessage: "WhatsApp settings saved",
            })
          }
        >
          <MessageCircle size={15} /> Save
        </button>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="admin-kicker">Recent messages</div>
          {(log.data ?? []).some((m) => m.status === "FAILED") && (
            <button
              className="admin-secondary-button h-9 whitespace-nowrap px-4 text-[0.65rem]"
              onClick={() =>
                actions.request({
                  title: "Retry the failed messages?",
                  message:
                    "Messages from the last 24 hours that failed will be sent again. Do this after fixing the cause, for example once a missing template is approved.",
                  confirmLabel: "Retry",
                  action: async () => {
                    await adminApi.retryFailedWhatsapp()
                    window.setTimeout(() => void log.reload(), 2500)
                  },
                  successMessage: "Trying again…",
                })
              }
            >
              Retry failed
            </button>
          )}
        </div>
        {(log.data ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-6 text-center text-xs text-[var(--text-muted)]">
            Nothing sent yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)]">
            {(log.data ?? []).slice(0, 8).map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--border-subtle)] bg-[var(--surface-soft)] px-3 py-2.5 last:border-0"
              >
                <span className="w-16 shrink-0 text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                  {m.kind === "BILL" ? "Bill" : m.kind === "TEST" ? "Test" : m.kind === "OFFER" ? "Offer" : "Report"}
                </span>
                <span className="shrink-0 whitespace-nowrap text-xs">{m.to}</span>
                <span className="flex-1" />
                <span className="text-[10px] text-[var(--text-muted)]">{when(m.sentAt ?? m.createdAt)}</span>
                <span
                  className={`inline-flex min-w-[4.5rem] justify-center rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-widest ${
                    m.status === "SENT"
                      ? "border-[rgba(46,125,88,0.3)] text-[#4CAF86]"
                      : m.status === "FAILED"
                        ? "border-[rgba(224,96,96,0.3)] text-[#E06060]"
                        : "border-[var(--border)] text-[var(--text-muted)]"
                  }`}
                >
                  {m.status === "FAILED"
                    ? "Failed"
                    : m.status === "SENT"
                      ? m.deliveryStatus === "read"
                        ? "Read ✓✓"
                        : m.deliveryStatus === "delivered"
                          ? "Delivered ✓✓"
                          : "Sent ✓"
                      : "Queued"}
                </span>
                {m.status === "FAILED" && m.error && (
                  <span className="w-full text-[10px] leading-snug text-[#E06060]">{m.error}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {actions.feedback}
    </section>
  )
}
