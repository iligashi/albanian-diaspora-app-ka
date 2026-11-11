import { addDays, addMonths, addWeeks, addYears } from "date-fns"

/** How often a recurring plan repeats. */
export const PLAN_INTERVALS = ["weekly", "biweekly", "monthly", "yearly"] as const
export type PlanInterval = (typeof PLAN_INTERVALS)[number]

export const REPEAT_OPTIONS = [
  { value: "once", label: "Just once" },
  { value: "weekly", label: "Every week" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Every month" },
  { value: "yearly", label: "Every year" },
] as const

export type PlanKind = "bill" | "gift" | "booking"

/**
 * How many days before each occurrence the runner places the order: bills are
 * paid on the day, gifts need the shop to prepare, bookings need the provider
 * to confirm.
 */
export const LEAD_DAYS: Record<PlanKind, number> = { bill: 0, gift: 3, booking: 4 }

export function nextOccurrenceAfter(date: Date, interval: PlanInterval): Date {
  switch (interval) {
    case "weekly":
      return addWeeks(date, 1)
    case "biweekly":
      return addWeeks(date, 2)
    case "monthly":
      return addMonths(date, 1)
    case "yearly":
      return addYears(date, 1)
  }
}

export function runAtFor(kind: PlanKind, occurrence: Date): Date {
  return addDays(occurrence, -LEAD_DAYS[kind])
}

/** After this many failed runs in a row a plan pauses itself and the customer is told why. */
export const MAX_CONSECUTIVE_FAILURES = 3
