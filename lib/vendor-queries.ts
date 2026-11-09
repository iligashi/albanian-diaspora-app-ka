import "server-only"
import { startOfMonth } from "date-fns"
import type { Types } from "mongoose"
import { Booking, GiftOrder } from "./models"

/** Statuses where the vendor is the one who needs to act next. */
export const VENDOR_GIFT_QUEUE = { action: ["placed"], active: ["accepted", "out_for_delivery"], done: ["delivered", "rejected", "cancelled"] } as const
export const VENDOR_BOOKING_QUEUE = { action: ["requested"], active: ["confirmed", "in_progress"], done: ["completed", "declined", "cancelled"] } as const

export async function vendorOverview(vendorId: Types.ObjectId, kind: "gifts" | "services") {
  const monthStart = startOfMonth(new Date())
  if (kind === "gifts") {
    const [needsAction, active, earned] = await Promise.all([
      GiftOrder.countDocuments({ vendor: vendorId, status: { $in: VENDOR_GIFT_QUEUE.action } }),
      GiftOrder.countDocuments({ vendor: vendorId, status: { $in: VENDOR_GIFT_QUEUE.active } }),
      GiftOrder.aggregate<{ total: number; count: number }>([
        { $match: { vendor: vendorId, status: "delivered", updatedAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: "$subtotalCents" }, count: { $sum: 1 } } },
      ]),
    ])
    return { needsAction, active, earnedCents: earned[0]?.total ?? 0, completed: earned[0]?.count ?? 0 }
  }
  const [needsAction, active, earned] = await Promise.all([
    Booking.countDocuments({ vendor: vendorId, status: { $in: VENDOR_BOOKING_QUEUE.action } }),
    Booking.countDocuments({ vendor: vendorId, status: { $in: VENDOR_BOOKING_QUEUE.active } }),
    Booking.aggregate<{ total: number; count: number }>([
      { $match: { vendor: vendorId, status: "completed", updatedAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: "$priceCents" }, count: { $sum: 1 } } },
    ]),
  ])
  return { needsAction, active, earnedCents: earned[0]?.total ?? 0, completed: earned[0]?.count ?? 0 }
}
