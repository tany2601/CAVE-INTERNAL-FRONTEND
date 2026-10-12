import { formatAmount } from "./format"

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
}

/** Short bill number printed on the message and picture (same rule as the server). */
export const billNo = (id: string) => id.replace(/-/g, "").slice(-6).toUpperCase()

/** The bill as a friendly multi-line WhatsApp message (used when staff send it by hand). */
export function billText(b: BillTextInput): string {
  const walkIn = /^product sale$/i.test(b.customerName.trim())
  const first = walkIn ? "" : b.customerName.trim().split(/\s+/)[0]
  const lines = [
    `*${b.branchName}*`,
    first ? `Thank you for visiting us, ${first}!` : "Thank you for visiting us!",
    "",
    ...b.services.map((s) => `• ${s.name}  ${price(s.price)}`),
    ...b.products.flatMap((p) =>
      Array.from({ length: p.qty }, () => `• ${p.name}  ${price(p.price)}`),
    ),
  ]
  if (b.discountAmount > 0) lines.push(`Discount  -${formatAmount(b.discountAmount)}`)
  if (b.tip > 0) lines.push(`Tip  ${formatAmount(b.tip)}`)
  lines.push(
    "",
    `*Total paid: ${formatAmount(b.total)}* (${b.paymentMode === "gpay" ? "GPay" : "Cash"})`,
    `Bill no. ${b.billNo}`,
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
