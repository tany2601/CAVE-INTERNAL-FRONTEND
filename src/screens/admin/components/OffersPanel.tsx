import { useEffect, useState } from "react"
import { Check, ImagePlus, Megaphone, Send, X } from "lucide-react"
import { adminApi } from "../../../lib/api"
import type { WhatsappAudience } from "../../../lib/api/admin"
import { useAsyncData } from "../../../hooks/useAsyncData"
import { useImageUpload } from "../../../hooks/useImageUpload"
import { useAdminActions } from "../hooks/useAdminActions"

const MAX_LENGTH = 600

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })

/** Admin → Settings card: write an offer, attach a picture, choose whose customers get it, and send it on WhatsApp. */
export function OffersPanel() {
  const actions = useAdminActions()
  const status = useAsyncData(() => adminApi.getWhatsapp())
  const branches = useAsyncData(() => adminApi.listBranches({ isActive: true }))
  const offers = useAsyncData(() => adminApi.listWhatsappOffers())
  const photo = useImageUpload("offers")

  const [message, setMessage] = useState("")
  const [image, setImage] = useState<string | null>(null)
  const [selected, setSelected] = useState<string[]>([]) // empty = every branch
  const [audience, setAudience] = useState<WhatsappAudience | null>(null)
  const count = audience?.count ?? null
  const [sending, setSending] = useState(false)

  const ready = status.data?.mode === "api" && status.data.configured
  const key = selected.join(",")

  // How many customers the current choice reaches.
  useEffect(() => {
    let live = true
    setAudience(null)
    adminApi
      .whatsappAudience(selected)
      .then((a) => live && setAudience(a))
      .catch(() => live && setAudience(null))
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const toggle = (id: string) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  const canSend = ready && message.trim().length >= 5 && !photo.uploading && !sending && (count ?? 0) > 0

  const scope =
    selected.length === 0
      ? "all branches"
      : (branches.data ?? [])
          .filter((b) => selected.includes(b.id))
          .map((b) => b.name)
          .join(", ")

  return (
    <section className="settings-panel settings-offers">
      <div className="settings-panel-number">05</div>
      <div>
        <div className="font-display font-800 text-2xl tracking-wider uppercase">Send an offer</div>
        <div className="mt-1 text-xs text-[var(--text-muted)]">
          Message your customers on WhatsApp about a deal, with an optional picture.
        </div>
      </div>

      {status.data && !ready && (
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-xs leading-relaxed text-[var(--text-secondary)]">
          Offers are sent through the WhatsApp Business API. Turn on <b>Automatic</b> in the WhatsApp card above (and
          have the keys added on the server) to use this.
        </div>
      )}

      <div className={`mt-5 grid gap-6 lg:grid-cols-2 ${ready ? "" : "pointer-events-none opacity-45"}`}>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="admin-kicker">Offer message</span>
            <textarea
              className="admin-textarea"
              style={{ minHeight: "9rem" }}
              maxLength={MAX_LENGTH}
              placeholder="e.g. Flat 20% off on Beard Spa this week. Show this message at the counter."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <span className="text-right text-[10px] text-[var(--text-muted)]">
              {message.length}/{MAX_LENGTH}
            </span>
          </label>

          <div>
            <div className="admin-kicker mb-2">Picture (optional)</div>
            {image ? (
              <div className="relative overflow-hidden rounded-xl border border-[var(--border-subtle)]">
                <img src={image} alt="Offer" className="max-h-56 w-full object-cover" />
                <button
                  className="admin-icon-button absolute right-2 top-2 bg-black/60 text-white"
                  aria-label="Remove picture"
                  onClick={() => setImage(null)}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="flex min-h-24 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] text-xs text-[var(--text-muted)]">
                <ImagePlus size={18} /> {photo.uploading ? "Uploading…" : "Add a JPG or PNG picture"}
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={async (e) => {
                    const url = await photo.upload(e.target.files?.[0])
                    if (url) setImage(url)
                    e.target.value = ""
                  }}
                />
              </label>
            )}
            {photo.error && <div className="mt-1 text-[11px] text-[#E06060]">{photo.error}</div>}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <div className="admin-kicker mb-2">Send to customers of</div>
            <div className="flex flex-wrap gap-2">
              <Chip active={selected.length === 0} onClick={() => setSelected([])}>
                All branches
              </Chip>
              {(branches.data ?? []).map((b) => (
                <Chip key={b.id} active={selected.includes(b.id)} onClick={() => toggle(b.id)}>
                  {b.name}
                </Chip>
              ))}
            </div>
            <div className="mt-2 text-[11px] leading-relaxed text-[var(--text-muted)]">
              Customers who have had a bill at the chosen branch(es) and have a WhatsApp number saved.
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-soft)] p-4">
            <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Reaches</div>
            <div className="font-display text-3xl font-800">{count === null ? "…" : count.toLocaleString("en-IN")}</div>
            <div className="text-[11px] text-[var(--text-muted)]">customers · {scope}</div>
            {audience && (audience.optedOut > 0 || audience.recentlyMessaged > 0) && (
              <div className="mt-2 text-[11px] leading-snug text-[var(--text-muted)]">
                Left out:{" "}
                {[
                  audience.optedOut > 0 && `${audience.optedOut} opted out or not on WhatsApp`,
                  audience.recentlyMessaged > 0 &&
                    `${audience.recentlyMessaged} got an offer in the last ${status.data?.offerLimit.minDaysBetween ?? 7} days`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                .
              </div>
            )}
            {status.data && (
              <div className="mt-1 text-[11px] text-[var(--text-muted)]">
                Today: {status.data.offerLimit.sentToday} of {status.data.offerLimit.perDay} offers sent. The limit keeps the
                number safe.
              </div>
            )}
          </div>

          <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
            WhatsApp charges for every offer message (more than for a bill), and only sends to people who agreed to
            hear from you. Line breaks in the message are shown as “·”.
          </p>

          <button
            className="admin-primary-button w-fit"
            disabled={!canSend}
            onClick={() =>
              actions.request({
                title: `Send this offer to ${count} customer${count === 1 ? "" : "s"}?`,
                message: `“${message.trim().slice(0, 140)}${message.trim().length > 140 ? "…" : ""}” will be sent on WhatsApp to customers of ${scope}${image ? ", with the picture" : ""}. This cannot be undone.`,
                confirmLabel: "Send offer",
                action: async () => {
                  setSending(true)
                  try {
                    await adminApi.sendWhatsappOffer({ message: message.trim(), imageUrl: image ?? undefined, branchIds: selected })
                    setMessage("")
                    setImage(null)
                    await offers.reload()
                  } finally {
                    setSending(false)
                  }
                },
                successMessage: "Offer is on its way",
              })
            }
          >
            <Send size={15} /> {sending ? "Sending…" : "Send offer"}
          </button>
        </div>
      </div>

      <div className="mt-6">
        <div className="admin-kicker mb-2">Recent offers</div>
        {(offers.data ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-6 text-center text-xs text-[var(--text-muted)]">
            No offers sent yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)]">
            {(offers.data ?? []).slice(0, 6).map((o) => (
              <div key={o.id} className="flex gap-3 border-b border-[var(--border-subtle)] bg-[var(--surface-soft)] p-3 last:border-0">
                {o.imageUrl ? (
                  <img src={o.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[var(--elevated)] text-[var(--text-muted)]">
                    <Megaphone size={18} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 text-sm">{o.message}</div>
                  <div className="mt-1 text-[10px] text-[var(--text-muted)]">
                    {when(o.createdAt)} · {o.branches.join(", ")}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-[11px]">
                    <span className="text-[#4CAF86]">{o.sent} sent</span>
                    {o.waiting > 0 && <span className="text-[var(--text-secondary)]">{o.waiting} waiting</span>}
                    {o.failed > 0 && <span className="text-[#E06060]">{o.failed} failed</span>}
                    <span className="text-[var(--text-muted)]">of {o.audience}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {actions.feedback}
    </section>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-xs ${
        active
          ? "border-[var(--text)] bg-[var(--text)] text-[var(--bg)]"
          : "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]"
      }`}
      onClick={onClick}
    >
      {active && <Check size={13} />}
      {children}
    </button>
  )
}
