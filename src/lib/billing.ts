import { halfRate } from "./gst"
import { round2 } from "./money"

export type DiscountMode = "percent" | "amount"

/** A typed discount value ("", "12.5") as a number; anything unreadable is 0. */
export const parseValue = (text: string): number => {
  const n = Number(text)
  return Number.isFinite(n) && n > 0 ? round2(n) : 0
}

/**
 * The rupees a discount takes off `base` (the services total, or the products total): a percentage (at most 100)
 * or an amount, never more than `base`. Same rule as the server, to the paisa.
 */
export function discountOn(mode: DiscountMode, value: number, base: number): number {
  if (!(base > 0) || !(value > 0)) return 0
  const raw = mode === "percent" ? (base * Math.min(value, 100)) / 100 : value
  return Math.min(round2(base), round2(raw))
}

/** Lines with the same name and price become one with a quantity ("Haircut ×3"); a free line stays apart. */
export function groupLines<T extends { name: string; price: number }>(
  lines: T[],
): { name: string; price: number; qty: number; total: number }[] {
  const out: { name: string; price: number; qty: number; total: number }[] = []
  for (const l of lines) {
    const found = out.find((o) => o.name === l.name && o.price === l.price)
    if (found) {
      found.qty += 1
      found.total = round2(found.total + l.price)
    } else out.push({ name: l.name, price: l.price, qty: 1, total: l.price })
  }
  return out
}

export const withQty = (name: string, qty: number) => (qty > 1 ? `${name} ×${qty}` : name)

/** One GST side as it is printed: its taxable value and CGST / SGST. */
export interface GstRowPart {
  rate: number
  inclusive: boolean
  taxable: number
  cgst: number
  sgst: number
}

/** The tax lines of a bill, in the order they are printed: for services, then products. */
export function gstRows(
  gst: { services: GstRowPart; products: GstRowPart },
  codes: { services?: string; products?: string } = {},
): { label: string; amount: number; tax: boolean }[] {
  const rows: { label: string; amount: number; tax: boolean }[] = []
  for (const [key, name] of [
    ["services", "Services"],
    ["products", "Products"],
  ] as const) {
    const part = gst[key]
    if (part.taxable <= 0 && part.cgst <= 0) continue
    const half = halfRate(part.rate)
    const note = part.inclusive ? " (incl.)" : ""
    const code = codes[key] ? ` (${codes[key]})` : ""
    rows.push({ label: `${name} taxable value${code}`, amount: part.taxable, tax: false })
    rows.push({ label: `CGST @ ${half}%${note}`, amount: part.cgst, tax: true })
    rows.push({ label: `SGST @ ${half}%${note}`, amount: part.sgst, tax: true })
  }
  return rows
}
