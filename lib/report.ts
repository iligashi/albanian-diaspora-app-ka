import "server-only"
import { Types } from "mongoose"
import { Bill, Booking, GiftOrder, Transaction, WalletEntry } from "./models"

/** Statuses that mean the money was actually spent (not failed, refunded or cancelled). */
const SPENT = {
  bill: ["paid", "settled"],
  gift: ["placed", "accepted", "out_for_delivery", "delivered"],
  booking: ["requested", "confirmed", "in_progress", "completed"],
}

export type YearReport = Awaited<ReturnType<typeof yearlyReport>>

/** Where the money went in a year: per month, per type, per family member. */
export async function yearlyReport(customerId: string, year: number) {
  const customer = new Types.ObjectId(customerId)
  const range = { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) }

  const [ledger, ...perPerson] = await Promise.all([
    Transaction.aggregate<{ _id: { month: number; kind: string; type: string }; total: number }>([
      { $match: { customer, status: "succeeded", createdAt: range } },
      { $group: { _id: { month: { $month: "$createdAt" }, kind: "$subjectKind", type: "$type" }, total: { $sum: "$amountCents" } } },
    ]),
    ...([
      [Bill, SPENT.bill],
      [GiftOrder, SPENT.gift],
      [Booking, SPENT.booking],
    ] as const).map(([model, statuses]) =>
      (model as typeof Bill).aggregate<{ _id: string; total: number; count: number }>([
        { $match: { customer, createdAt: range, status: { $in: statuses } } },
        { $group: { _id: "$recipient.fullName", total: { $sum: "$totalCents" }, count: { $sum: 1 } } },
      ]),
    ),
  ])
  const topUps = await WalletEntry.aggregate<{ total: number }>([
    { $match: { user: customer, type: "top_up", createdAt: range } },
    { $group: { _id: null, total: { $sum: "$amountCents" } } },
  ])

  const months = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, cents: 0 }))
  const byKind: Record<string, number> = { bill: 0, gift: 0, booking: 0 }
  for (const row of ledger) {
    const sign = row._id.type === "refund" ? -1 : 1
    months[row._id.month - 1].cents += sign * row.total
    byKind[row._id.kind] = (byKind[row._id.kind] ?? 0) + sign * row.total
  }

  const people = new Map<string, { name: string; cents: number; orders: number }>()
  for (const rows of perPerson) {
    for (const r of rows) {
      const p = people.get(r._id) ?? { name: r._id, cents: 0, orders: 0 }
      p.cents += r.total
      p.orders += r.count
      people.set(r._id, p)
    }
  }

  return {
    year,
    totalCents: months.reduce((s, m) => s + m.cents, 0),
    months,
    byKind,
    people: [...people.values()].sort((a, b) => b.cents - a.cents),
    orders: [...people.values()].reduce((s, p) => s + p.orders, 0),
    walletTopUpsCents: topUps[0]?.total ?? 0,
  }
}
