import { useEffect, useState } from "react"
import { Button, PhoneInput } from "../../components/ui"
import { Session } from "../../types"
import { formatAmount } from "../../lib/format"
import { useBranchData } from "../../context/BranchDataContext"
import { staffApi } from "../../lib/api"
import { billNo, billText, whatsappLink } from "../../lib/billText"
import { isValidPhone, sanitizePhone } from "../../lib/phone"
import { groupLines, withQty } from "../../lib/billing"
import { CheckCircle, Download, MessageCircle, Share2 } from "lucide-react"

interface Props {
  session: Session
  total: number
  paymentMode: "cash" | "gpay"
  onDone: () => void
}

export default function SessionSuccess({
  session,
  total,
  paymentMode,
  onDone,
}: Props) {
  const { getStylist } = useBranchData()
  const stylist = getStylist(session.stylistId)

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg)] flex flex-col items-center px-6 py-8 gap-8 overflow-y-auto animate-fade-in [&>*:first-child]:mt-auto [&>*:last-child]:mb-auto">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-[rgba(46,125,88,0.1)] border border-[rgba(46,125,88,0.2)] flex items-center justify-center">
          <CheckCircle size={28} className="text-[#4CAF86]" strokeWidth={1.5} />
        </div>
        <div className="font-display font-800 tracking-wider uppercase text-xl text-[var(--text)]">
          Session Completed
        </div>
      </div>

      <div className="w-full bg-[var(--surface)] border border-[var(--border-subtle)] rounded-sm p-5 flex flex-col gap-3">
        <Row label="Customer" value={session.customerName} />
        <Row label="Stylist" value={stylist?.name || "—"} />
        <Row
          label="Services"
          value={session.services ? groupLines(session.services).map((l) => withQty(l.name, l.qty)).join(", ") : "—"}
        />
        <div className="border-t border-[var(--border-subtle)] pt-3">
          <Row label="Total" value={formatAmount(total)} bold />
          <Row
            label="Payment"
            value={paymentMode === "gpay" ? "GPay" : "Cash"}
          />
        </div>
      </div>

      <WhatsappBill session={session} total={total} paymentMode={paymentMode} />

      <Button variant="primary" fullWidth size="lg" onClick={onDone}>
        Done
      </Button>
    </div>
  )
}

function Row({
  label,
  value,
  bold,
}: {
  label: string
  value: string
  bold?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">
        {label}
      </span>
      <span
        className={`text-sm ${
          bold
            ? "font-display font-700 text-[var(--text)]"
            : "text-[var(--text-secondary)]"
        }`}
      >
        {value}
      </span>
    </div>
  )
}

/**
 * What happens with the bill on WhatsApp, depending on the admin's choice:
 *  · automatic: the server already sent it; this just says so (and shows the picture)
 *  · manual: buttons to open WhatsApp with the bill typed in, or to share the bill picture
 *  · off: nothing
 */
function WhatsappBill({
  session,
  total,
  paymentMode,
}: {
  session: Session
  total: number
  paymentMode: "cash" | "gpay"
}) {
  const { whatsapp, branchName } = useBranchData()
  const saved = sanitizePhone(session.customerPhone ?? "")
  const [typed, setTyped] = useState("")
  const number = isValidPhone(saved) ? saved : typed
  const [picture, setPicture] = useState<{ blob: Blob; url: string } | null>(null)
  const [pictureError, setPictureError] = useState(false)
  const wantsPicture = whatsapp.mode !== "off" && whatsapp.billFormat === "image"

  // The picture is the same one the server sends in automatic mode; staff share it by hand in manual mode.
  useEffect(() => {
    if (!wantsPicture) return
    let url: string | null = null
    let live = true
    staffApi
      .getBillImage(session.id)
      .then((blob) => {
        if (!live) return
        url = URL.createObjectURL(blob)
        setPicture({ blob, url })
      })
      .catch(() => live && setPictureError(true))
    return () => {
      live = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [wantsPicture, session.id])

  if (whatsapp.mode === "off") return null

  const text = billText({
    customerName: session.customerName,
    branchName,
    services: session.services,
    products: session.products ?? [],
    discountAmount: session.discountAmount ?? 0,
    tip: session.tip ?? 0,
    total,
    paymentMode,
    billNo: billNo(session.id),
  })
  const link = whatsappLink(number, text)

  const preview = wantsPicture && (
    <div className="w-full">
      {picture ? (
        <img
          src={picture.url}
          alt="The bill"
          className="mx-auto max-h-[46dvh] w-auto max-w-full rounded-sm border border-[var(--border-subtle)]"
        />
      ) : (
        !pictureError && <div className="py-6 text-center text-xs text-[var(--text-muted)]">Preparing the bill picture…</div>
      )}
    </div>
  )

  if (whatsapp.mode === "api") {
    return (
      <div className="flex w-full flex-col items-center gap-3 animate-fade-in">
        <AutomaticStatus sessionId={session.id} phone={isValidPhone(saved) ? saved : null} />
        {preview}
      </div>
    )
  }

  const share = async () => {
    if (!picture) return
    const file = new File([picture.blob], `CAVE-bill-${billNo(session.id)}.png`, { type: "image/png" })
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text })
        return
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return // the person closed the share sheet
    }
    // No share sheet (desktop): download the picture instead.
    const a = document.createElement("a")
    a.href = picture.url
    a.download = file.name
    a.click()
  }

  return (
    <div className="flex w-full flex-col gap-3 animate-fade-in">
      {!isValidPhone(saved) && (
        <div>
          <PhoneInput
            value={typed}
            onChange={(v) => setTyped(sanitizePhone(v))}
            placeholder="Customer's WhatsApp number"
            className="w-full bg-[var(--surface)] border border-[var(--border)] px-4 py-3 text-[var(--text)] outline-none"
          />
        </div>
      )}
      {preview}
      {isValidPhone(saved) && (
        <div className="text-center text-[11px] leading-relaxed text-[var(--text-subtle)]">
          WhatsApp should have opened with the bill. If it didn't, tap the button below.
        </div>
      )}
      <Button
        variant="primary"
        fullWidth
        size="lg"
        disabled={!link}
        onClick={() => link && window.open(link, "_blank", "noopener")}
      >
        <MessageCircle size={17} className="mr-2" /> Send bill on WhatsApp
      </Button>
      {wantsPicture && (
        <Button variant="secondary" fullWidth size="md" disabled={!picture} onClick={() => void share()}>
          {typeof navigator.share === "function" ? <Share2 size={15} className="mr-2" /> : <Download size={15} className="mr-2" />}
          {typeof navigator.share === "function" ? "Share the bill picture" : "Download the bill picture"}
        </Button>
      )}
      {!link && (
        <div className="text-center text-[11px] text-[var(--text-subtle)]">Enter the customer's number to send the bill.</div>
      )}
    </div>
  )
}

/**
 * Automatic mode: the server sends the bill in the background, so this follows the real outcome
 * instead of claiming success when the message has only been queued.
 */
function AutomaticStatus({ sessionId, phone }: { sessionId: string; phone: string | null }) {
  const [status, setStatus] = useState<"none" | "PENDING" | "SENT" | "FAILED">("none")
  const [waited, setWaited] = useState(0)

  useEffect(() => {
    if (!phone) return
    let live = true
    let tries = 0
    const check = async () => {
      try {
        const s = await staffApi.getBillWhatsapp(sessionId)
        if (!live) return
        setStatus(s)
        setWaited(tries)
        if (s === "SENT" || s === "FAILED" || tries >= 12) return
      } catch {
        // keep trying quietly; the message is sent by the server either way
      }
      tries += 1
      window.setTimeout(() => live && void check(), 2000)
    }
    void check()
    return () => {
      live = false
    }
  }, [sessionId, phone])

  if (!phone) {
    return <div className="text-center text-[11px] tracking-wide text-[var(--text-muted)]">No WhatsApp number was added, so no bill was sent.</div>
  }
  const to = `+91 ${phone}`
  if (status === "SENT") return <div className="text-center text-[11px] tracking-wide text-[#4CAF86]">Bill sent to {to} on WhatsApp</div>
  if (status === "FAILED") {
    return (
      <div className="text-center text-[11px] leading-relaxed tracking-wide text-[#E06060]">
        The bill could not be sent to {to} on WhatsApp. The admin can see why in Settings → WhatsApp.
      </div>
    )
  }
  // Nothing queued after a while means the server isn't set up to send.
  if (status === "none" && waited >= 4) {
    return (
      <div className="text-center text-[11px] leading-relaxed tracking-wide text-[var(--text-muted)]">
        The bill was not sent: WhatsApp isn't connected on the server.
      </div>
    )
  }
  return <div className="text-center text-[11px] tracking-wide text-[var(--text-muted)]">Sending the bill to {to} on WhatsApp…</div>
}
