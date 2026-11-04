/** The payment method as people know it: the rupee note for cash, the Google Pay logo for GPay. */
export function PayLabel({ mode, size = 22 }: { mode: "cash" | "gpay"; size?: number }) {
  if (mode === "gpay") {
    // The logo has dark lettering, so it sits on a white chip and reads on any button colour.
    return (
      <span className="inline-flex items-center rounded-sm bg-white px-1.5" style={{ height: size + 4 }}>
        <img src="/images/pay/gpay.png" alt="GPay" width={size + 8} height={size} style={{ height: size, width: "auto" }} />
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <img src="/images/pay/cash.png" alt="" width={size} height={size} style={{ height: size, width: "auto" }} />
      Cash
    </span>
  )
}
