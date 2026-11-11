import { differenceInCalendarDays, startOfDay } from "date-fns"

/**
 * Dates that matter to Albanian families, used to remind people abroad to send
 * something home. Bajram dates follow the lunar calendar and can shift by a day
 * depending on the moon sighting, so they are marked approximate.
 */
export type Occasion = {
  key: string
  name: string
  date: Date
  approximate?: boolean
  /** Gift categories that suit the occasion, used for the "send a gift" link. */
  suggest: "flowers" | "cakes" | "food_baskets" | "sweets"
  recipient?: { id: string; fullName: string }
}

const FIXED: Array<{ key: string; name: string; month: number; day: number; suggest: Occasion["suggest"] }> = [
  { key: "new-year", name: "New Year (Viti i Ri)", month: 1, day: 1, suggest: "sweets" },
  { key: "valentines", name: "Valentine's Day", month: 2, day: 14, suggest: "flowers" },
  { key: "independence", name: "Kosovo Independence Day", month: 2, day: 17, suggest: "food_baskets" },
  { key: "mothers-day", name: "Mother's Day (8 Marsi)", month: 3, day: 8, suggest: "flowers" },
  { key: "summer-day", name: "Dita e Verës", month: 3, day: 14, suggest: "sweets" },
  { key: "flag-day", name: "Flag Day (28 Nëntori)", month: 11, day: 28, suggest: "food_baskets" },
  { key: "christmas", name: "Christmas (Krishtlindjet)", month: 12, day: 25, suggest: "food_baskets" },
]

/** Fitër Bajrami, Kurban Bajrami, and Catholic and Orthodox Easter. */
const MOVING: Array<{ key: string; name: string; dates: string[]; approximate?: boolean; suggest: Occasion["suggest"] }> = [
  { key: "bajram-fitr", name: "Fitër Bajrami (Eid al-Fitr)", dates: ["2026-03-20", "2027-03-10", "2028-02-27", "2029-02-15"], approximate: true, suggest: "sweets" },
  { key: "bajram-adha", name: "Kurban Bajrami (Eid al-Adha)", dates: ["2026-05-27", "2027-05-17", "2028-05-05", "2029-04-24"], approximate: true, suggest: "food_baskets" },
  { key: "easter", name: "Easter (Pashkët)", dates: ["2026-04-05", "2027-03-28", "2028-04-16", "2029-04-01"], suggest: "cakes" },
  { key: "orthodox-easter", name: "Orthodox Easter", dates: ["2026-04-12", "2027-05-02", "2028-04-16", "2029-04-08"], suggest: "cakes" },
]

const local = (y: number, m: number, d: number) => new Date(y, m - 1, d)

function nextFixed(today: Date, month: number, day: number) {
  const thisYear = local(today.getFullYear(), month, day)
  return thisYear >= today ? thisYear : local(today.getFullYear() + 1, month, day)
}

/** Next birthday on or after today. 29 February falls on 28 February in other years. */
export function nextBirthday(today: Date, month: number, day: number) {
  const fit = (year: number) => {
    const last = new Date(year, month, 0).getDate()
    return local(year, month, Math.min(day, last))
  }
  const thisYear = fit(today.getFullYear())
  return thisYear >= today ? thisYear : fit(today.getFullYear() + 1)
}

export function upcomingOccasions(
  now: Date,
  recipients: Array<{ id: string; fullName: string; birthday?: { month?: number | null; day?: number | null } | null }> = [],
  withinDays = 45,
): Array<Occasion & { inDays: number }> {
  const today = startOfDay(now)
  const list: Occasion[] = []
  for (const f of FIXED) list.push({ key: f.key, name: f.name, date: nextFixed(today, f.month, f.day), suggest: f.suggest })
  for (const m of MOVING) {
    const next = m.dates.map((d) => new Date(`${d}T00:00:00`)).find((d) => d >= today)
    if (next) list.push({ key: m.key, name: m.name, date: next, approximate: m.approximate, suggest: m.suggest })
  }
  for (const r of recipients) {
    if (!r.birthday?.month || !r.birthday?.day) continue
    list.push({
      key: `birthday-${r.id}`,
      name: `${r.fullName.split(" ")[0]}'s birthday`,
      date: nextBirthday(today, r.birthday.month, r.birthday.day),
      suggest: "cakes",
      recipient: { id: r.id, fullName: r.fullName },
    })
  }
  return list
    .map((o) => ({ ...o, inDays: differenceInCalendarDays(o.date, today) }))
    .filter((o) => o.inDays >= 0 && o.inDays <= withinDays)
    .sort((a, b) => a.inDays - b.inDays || Number(Boolean(b.recipient)) - Number(Boolean(a.recipient)))
}
