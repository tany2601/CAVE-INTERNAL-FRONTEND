import { formatAmount } from "./format"
import { groupLines, gstRows, withQty, type GstRowPart } from "./billing"

/** A line's price, or FREE for a ₹0 line (the free-haircut visit). */
const price = (n: number) => (n === 0 ? "FREE" : formatAmount(n))

export interface BillTextInput {
  customerName: string
  branchName: string
  services: { name: string; price: number }[]
  products: { name: string; price: number; qty: number }[]
  discountAmount: number
  tip: number
  total: number
  paymentMode: "cash" | "gpay"
  /** Last 6 characters of the session id, as printed on the picture. */
  billNo: string
  /** Present on a GST tax invoice: the seller's details and the tax on the bill. */
  invoice?: {
    number: string
    gstin: string
    legalName?: string
    address?: string
    phone?: string
    gst: { services: GstRowPart; products: GstRowPart }
    servicesCode?: string
    productsCode?: string
  }
}

/** The invoice part of a bill message for a closed bill, or undefined when it is not a GST tax invoice. */
export function invoiceOf(
  session: { invoiceNumber?: string; gstin?: string; gst?: { services: GstRowPart; products: GstRowPart } } | undefined,
  config: { legalName: string; servicesCode: string; productsCode: string } | null,
  address: string,
  phone: string,
): BillTextInput["invoice"] {
  if (!session?.invoiceNumber || !session.gstin || !session.gst) return undefined
  return {
    number: session.invoiceNumber,
    gstin: session.gstin,
    legalName: config?.legalName || undefined,
    address: address || undefined,
    phone: phone || undefined,
    gst: session.gst,
    servicesCode: config?.servicesCode || undefined,
    productsCode: config?.productsCode || undefined,
  }
}

/** Short bill number printed on the message and picture (same rule as the server). */
export const billNo = (id: string) => id.replace(/-/g, "").slice(-6).toUpperCase()

/** The bill as a friendly multi-line WhatsApp message (used when staff send it by hand). */
export function billText(b: BillTextInput): string {
  const walkIn = /^product sale$/i.test(b.customerName.trim())
  const first = walkIn ? "" : b.customerName.trim().split(/\s+/)[0]
  const inv = b.invoice
  const lines = [
    `*${b.branchName}*`,
    ...(inv
      ? [
          "TAX INVOICE",
          ...(inv.legalName ? [inv.legalName] : []),
          ...(inv.address ? [inv.address] : []),
          ...(inv.phone ? [`Phone: ${inv.phone}`] : []),
          `GSTIN: ${inv.gstin}`,
        ]
      : []),
    first ? `Thank you for visiting us, ${first}!` : "Thank you for visiting us!",
    "",
    // The same service several times (a customer paying for friends too) is one line with a quantity.
    ...groupLines(b.services).map((s) => `• ${withQty(s.name, s.qty)}  ${price(s.total)}`),
    ...groupLines(b.products.flatMap((p) => Array.from({ length: p.qty }, () => ({ name: p.name, price: p.price })))).map(
      (p) => `• ${withQty(p.name, p.qty)}  ${price(p.total)}`,
    ),
  ]
  if (b.discountAmount > 0) lines.push(`Discount  -${formatAmount(b.discountAmount)}`)
  if (inv) {
    for (const row of gstRows(inv.gst, { services: inv.servicesCode, products: inv.productsCode })) {
      lines.push(`${row.label}  ${formatAmount(row.amount)}`)
    }
  }
  if (b.tip > 0) lines.push(`Tip  ${formatAmount(b.tip)}`)
  lines.push(
    "",
    `*Total paid: ${formatAmount(b.total)}* (${b.paymentMode === "gpay" ? "GPay" : "Cash"})`,
    inv ? `Invoice no. ${inv.number}` : `Bill no. ${b.billNo}`,
    "",
    "We hope to see you again soon!",
  )
  return lines.join("\n")
}

/** wa.me link that opens a chat with the number and the message already typed. Null for an invalid number. */
export function whatsappLink(phone10: string, text: string): string | null {
  const digits = phone10.replace(/\D/g, "")
  if (!/^[6-9]\d{9}$/.test(digits)) return null
  return `https://wa.me/91${digits}?text=${encodeURIComponent(text)}`
}
