# GST on bills (for the accountant)

Where it is set: Admin → GST. The GSTIN, the registered name, the rates and whether menu prices include GST are
stored once for the business. Each bill keeps the GSTIN, rates and amounts it was issued with, so changing the
settings never alters a bill that already exists.

## What a bill carries

- **Seller:** registered name (if filled in), the branch's address and phone, the GSTIN.
- **Invoice number:** one running series per financial year (April to March), `CV/26-27/000001`, at most 16
  characters. It is taken inside the same database transaction that closes the bill, so there are no gaps and a bill
  that fails to save never uses a number. Cancelled bills keep their number.
- **Date and time** (Indian time), payment mode, place of supply (state of the GSTIN).
- **Lines:** each service and product with quantity and price.
- **Tax summary** for services and for products separately: taxable value, CGST, SGST (and the SAC / HSN code if
  entered in Admin → GST).

## How the tax is worked out

All maths is in whole paise. CGST always equals SGST (a salon sale is intra-state; no IGST).

| | Services | Products |
|---|---|---|
| Rate (default) | 5% = CGST 2.5% + SGST 2.5% | 18% = CGST 9% + SGST 9% |
| Prices | Haircuts and beard services: GST **included** in the menu price. Every other service, and custom services: GST **added on top** | GST **added on top** of the product price |

Each service has one of three modes, set per branch in Admin → GST (a selector beside each service):

- **+ GST** (ADD_ON_TOP): GST is added on top of the menu price.
- **Incl. GST** (INCLUDED_IN_PRICE): the customer pays the menu price and the GST is taken out of it.
- **No GST** (NO_GST): no GST is charged. The price is not part of any taxable value; the bill shows it on its own line
  ("Non-GST services (no GST charged)") so it is clear why no GST was charged.

The services discount is shared between the three kinds in proportion, to the paisa.
- **Added on top:** taxable value = amount after discount; each half = taxable × half the rate, rounded to the nearest
  paisa; the customer pays taxable + CGST + SGST. Example: ₹300 → ₹7.50 + ₹7.50 → ₹315.
- **Included:** the customer pays exactly the price. Each half = half the exact tax, rounded to the nearest paisa,
  and the taxable value is what is left, so taxable + CGST + SGST equals the price to the paisa. Example: ₹599 →
  taxable ₹507.62, CGST ₹45.69, SGST ₹45.69.
- **Discounts** reduce the taxable value (services and products have their own discount).
- **Tips** are the customer's gift, not part of the price, and carry no GST.
- A free (6th-visit) haircut is billed at ₹0 and has no tax.

## Reports

- The Excel report has a "GST collected" block on the Summary sheet (taxable value, CGST, SGST, total, revenue
  excluding GST), and the Bills sheet has invoice number, taxable value, CGST, SGST and GSTIN for every bill.
- "Revenue" in the app means money collected without tips, so it **includes** GST. Staff revenue, targets and
  commission are worked from sales **without** GST and tips.

## Things the accountant should confirm

- The rates, and which prices include GST (both can be changed in Admin → GST).
- SAC / HSN codes to print.
- A bill edited after it was issued keeps its invoice number and its original rates but its amounts change; if
  invoices must not change once issued, cancel the bill and issue a new one (or use credit notes).
- A bill cancelled after it was issued keeps its invoice number in the series; reports leave it out.
