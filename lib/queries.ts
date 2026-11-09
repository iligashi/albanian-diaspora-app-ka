import "server-only"
import { startOfMonth } from "date-fns"
import { Types } from "mongoose"
import { getBillProvider } from "./domain/catalog"
import { Bill, Booking, GiftOrder, Transaction } from "./models"

/**
 * Read models for dashboards. Kept separate from the write services so pages
 * fetch exactly the shape they render.
 */

export const OPEN_GIFT = ["placed", "accepted", "out_for_delivery"] as const
export const OPEN_BOOKING = ["requested", "confirmed", "in_progress"] as const

export type ActivityItem = {
  kind: "bill" | "gift" | "booking"
  id: string
  reference: string
  title: string
  subtitle: string
  status: string
  totalCents: number
  date: Date
  href: string
}

export async function customerActivity(customerId: string, limit = 8): Promise<ActivityItem[]> {
  const customer = new Types.ObjectId(customerId)
  const [bills, gifts, bookings] = await Promise.all([
    Bill.find({ customer }).sort({ createdAt: -1 }).limit(limit).lean(),
    GiftOrder.find({ customer }).sort({ createdAt: -1 }).limit(limit).lean(),
    Booking.find({ customer }).sort({ createdAt: -1 }).limit(limit).lean(),
  ])
  const items: ActivityItem[] = [
    ...bills.map((b) => ({
      kind: "bill" as const,
      id: b._id.toString(),
      reference: b.reference,
      title: `${getBillProvider(b.provider)?.name ?? b.provider} bill`,
      subtitle: `For ${b.recipient.fullName}`,
      status: b.status,
      totalCents: b.totalCents,
      date: b.createdAt,
      href: `/bills/${b._id}`,
    })),
    ...gifts.map((g) => ({
      kind: "gift" as const,
      id: g._id.toString(),
      reference: g.reference,
      title: g.items.map((i) => i.name).join(", "),
      subtitle: `For ${g.recipient.fullName}`,
      status: g.status,
      totalCents: g.totalCents,
      date: g.createdAt,
      href: `/gifts/orders/${g._id}`,
    })),
    ...bookings.map((b) => ({
      kind: "booking" as const,
      id: b._id.toString(),
      reference: b.reference,
      title: b.offeringTitle,
      subtitle: `For ${b.recipient.fullName}`,
      status: b.status,
      totalCents: b.totalCents,
      date: b.createdAt,
      href: `/services/bookings/${b._id}`,
    })),
  ]
  return items.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit)
}

export async function customerOverview(customerId: string) {
  const customer = new Types.ObjectId(customerId)
  const [openGifts, openBookings, billsInProgress, monthTotals, upcomingBookings, upcomingDeliveries] = await Promise.all([
    GiftOrder.countDocuments({ customer, status: { $in: OPEN_GIFT } }),
    Booking.countDocuments({ customer, status: { $in: OPEN_BOOKING } }),
    Bill.countDocuments({ customer, status: "paid" }),
    Transaction.aggregate<{ _id: string; total: number }>([
      { $match: { customer, status: "succeeded", createdAt: { $gte: startOfMonth(new Date()) } } },
      { $group: { _id: "$type", total: { $sum: "$amountCents" } } },
    ]),
    Booking.find({ customer, status: { $in: ["requested", "confirmed"] }, date: { $gte: new Date(Date.now() - 864e5) } })
      .sort({ date: 1 })
      .limit(3)
      .lean(),
    GiftOrder.find({ customer, status: { $in: OPEN_GIFT } })
      .sort({ deliveryDate: 1 })
      .limit(3)
      .lean(),
  ])
  const charged = monthTotals.find((t) => t._id === "charge")?.total ?? 0
  const refunded = monthTotals.find((t) => t._id === "refund")?.total ?? 0
  return {
    openOrders: openGifts + openBookings + billsInProgress,
    spentThisMonthCents: charged - refunded,
    upcomingBookings,
    upcomingDeliveries,
  }
}
