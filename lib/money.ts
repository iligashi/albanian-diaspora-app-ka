/**
 * Money is stored as integer cents everywhere (never floats) and the platform
 * operates in EUR, which is Kosovo's currency.
 */
export const CURRENCY = "EUR" as const

const formatter = new Intl.NumberFormat("en-IE", { style: "currency", currency: CURRENCY })

export function formatMoney(cents: number) {
  return formatter.format(cents / 100)
}

/** Parses user input such as "12", "12.5" or "12,50" into cents. Returns null when invalid. */
export function parseMoneyToCents(input: string | number): number | null {
  const text = String(input).trim().replace(",", ".")
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null
  const [whole, fraction = ""] = text.split(".")
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"))
}

/** Service fee charged on top of every bill payment, gift order and booking. */
export function serviceFeeCents(subtotalCents: number) {
  // 2.5%, with a €0.99 minimum and a €9.99 cap.
  const fee = Math.round(subtotalCents * 0.025)
  return Math.min(Math.max(fee, 99), 999)
}
