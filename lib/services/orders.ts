import "server-only"
import { Types } from "mongoose"
import type { z } from "zod"
import { getBillProvider } from "../domain/catalog"
import { billMachine, bookingMachine, giftMachine, type Actor, type BookingStatus, type GiftStatus } from "../domain/workflow"
import { formatMoney, serviceFeeCents } from "../money"
import { Bill, Booking, GiftOrder, Offering, Product, Recipient, User, Vendor, type BookingDoc, type GiftOrderDoc, type RecipientDoc } from "../models"
import { formatDate, humanize, makeReference } from "../utils"
import type { billSchema, bookingSchema, giftOrderSchema, recipientSchema, reviewSchema } from "../validation"
import { AppError, charge, notify, refund, transition, type PaymentSource } from "./core"

/** Options shared by every order: how to pay, and the recurring plan that created it (if any). */
export type OrderOptions = { source?: PaymentSource; planId?: Types.ObjectId }

const oid = (id: string) => new Types.ObjectId(id)

function snapshot(r: RecipientDoc) {
  return { recipientId: r._id, fullName: r.fullName, phone: r.phone ?? undefined, city: r.city, addressLine: r.addressLine }
}

async function ownedRecipient(customerId: string, recipientId: string) {
  const recipient = await Recipient.findOne({ _id: recipientId, owner: customerId }).lean<RecipientDoc>()
  if (!recipient) throw new AppError("Choose one of your saved family members.")
  return recipient
}

async function notifyAdmins(title: string, body: string, href: string) {
  const admins = await User.find({ role: "admin", status: "active" }).select("_id").lean()
  await Promise.all(admins.map((a) => notify(a._id, title, body, href)))
}

// ------------------------------------------------------------------ recipients

export async function saveRecipient(customerId: string, form: z.infer<typeof recipientSchema>, recipientId?: string) {
  const { birthdayMonth, birthdayDay, ...rest } = form
  if (Boolean(birthdayMonth) !== Boolean(birthdayDay)) throw new AppError("Choose both the day and the month of the birthday, or neither.")
  if (birthdayMonth && birthdayDay && birthdayDay > new Date(2024, birthdayMonth, 0).getDate()) throw new AppError("That birthday date doesn't exist.")
  const input = { ...rest, birthday: birthdayMonth && birthdayDay ? { month: birthdayMonth, day: birthdayDay } : undefined }
  if (recipientId) {
    const updated = await Recipient.findOneAndUpdate(
      { _id: recipientId, owner: customerId },
      input.birthday ? { $set: input } : { $set: rest, $unset: { birthday: 1 } },
      { new: true },
    )
    if (!updated) throw new AppError("Family member not found.")
    return updated
  }
  const count = await Recipient.countDocuments({ owner: customerId })
  if (count >= 25) throw new AppError("You can save up to 25 family members.")
  return Recipient.create({ ...input, owner: customerId })
}

export async function deleteRecipient(customerId: string, recipientId: string) {
  // Orders keep their own snapshot, so removing a saved recipient never breaks history.
  const res = await Recipient.deleteOne({ _id: recipientId, owner: customerId })
  if (res.deletedCount === 0) throw new AppError("Family member not found.")
}

// ------------------------------------------------------------------ bills

export async function payBill(customerId: string, input: Pick<z.infer<typeof billSchema>, "recipientId" | "provider" | "accountNumber" | "period" | "amount">, opts: OrderOptions = {}) {
  const recipient = await ownedRecipient(customerId, input.recipientId)
  const provider = getBillProvider(input.provider)!
  const feeCents = serviceFeeCents(input.amount)
  const bill = await Bill.create({
    reference: makeReference("BL"),
    customer: customerId,
    recipient: snapshot(recipient),
    provider: input.provider,
    accountNumber: input.accountNumber,
    period: input.period,
    amountCents: input.amount,
    feeCents,
    totalCents: input.amount + feeCents,
    status: billMachine.initial,
    plan: opts.planId,
    events: [{ status: billMachine.initial, actor: opts.planId ? "system" : "customer" }],
  })

  const result = await charge(
    { kind: "bill", id: bill._id, reference: bill.reference, customer: bill.customer, description: `${provider.name} bill for ${recipient.fullName}` },
    bill.totalCents,
    opts.source,
  )
  const { updated } = await transition({
    model: Bill,
    machine: billMachine,
    doc: bill.toObject(),
    to: result.ok ? "paid" : "payment_failed",
    actor: "system",
    note: result.ok ? undefined : result.reason,
  })
  if (result.ok) {
    await notifyAdmins("Bill to settle", `${bill.reference}: ${formatMoney(bill.amountCents)} to ${provider.name}.`, "/admin/bills")
  }
  return updated
}

// ------------------------------------------------------------------ gifts

export async function placeGiftOrder(customerId: string, input: Pick<z.infer<typeof giftOrderSchema>, "productId" | "quantity" | "recipientId" | "deliveryDate" | "message">, opts: OrderOptions = {}) {
  const [recipient, product] = await Promise.all([
    ownedRecipient(customerId, input.recipientId),
    Product.findOne({ _id: input.productId, active: true }).lean(),
  ])
  if (!product) throw new AppError("This gift is no longer available.")
  const vendor = await Vendor.findOne({ _id: product.vendor, status: "approved", kind: "gifts" }).lean()
  if (!vendor) throw new AppError("This shop isn't taking orders right now.")
  if (!vendor.serviceCities.includes(recipient.city)) {
    throw new AppError(`${vendor.businessName} doesn't deliver to ${recipient.city}. Choose a shop that does.`)
  }

  const subtotalCents = product.priceCents * input.quantity
  const feeCents = serviceFeeCents(subtotalCents)
  const order = await GiftOrder.create({
    reference: makeReference("GF"),
    customer: customerId,
    vendor: vendor._id,
    recipient: snapshot(recipient),
    items: [{ product: product._id, name: product.name, unitPriceCents: product.priceCents, quantity: input.quantity }],
    subtotalCents,
    feeCents,
    totalCents: subtotalCents + feeCents,
    message: input.message,
    deliveryDate: input.deliveryDate,
    status: giftMachine.initial,
    plan: opts.planId,
    events: [{ status: giftMachine.initial, actor: opts.planId ? "system" : "customer" }],
  })

  const result = await charge(
    { kind: "gift", id: order._id, reference: order.reference, customer: order.customer, description: `${product.name} for ${recipient.fullName}` },
    order.totalCents,
    opts.source,
  )
  const { updated } = await transition({
    model: GiftOrder,
    machine: giftMachine,
    doc: order.toObject(),
    to: result.ok ? "placed" : "payment_failed",
    actor: "system",
    note: result.ok ? undefined : result.reason,
  })
  if (result.ok) {
    await notify(vendor.user, "New gift order", `${order.reference}: ${product.name} × ${input.quantity} for delivery on ${formatDate(input.deliveryDate)} in ${recipient.city}.`, `/vendor/orders/${order._id}`)
  }
  return updated
}

const GIFT_MESSAGES: Partial<Record<GiftStatus, string>> = {
  accepted: "The shop accepted your order and is preparing it.",
  out_for_delivery: "Your gift is on its way.",
  delivered: "Your gift was delivered.",
  rejected: "The shop couldn't fulfil your order. You've been refunded in full.",
  cancelled: "The order was cancelled and refunded in full.",
}

/** Moves a gift order. `actor` decides which transitions are allowed; ownership is checked here. */
export async function updateGiftOrder(user: { id: string; role: Actor }, orderId: string, to: GiftStatus, note?: string) {
  const order = await GiftOrder.findById(orderId).lean<GiftOrderDoc>()
  if (!order) throw new AppError("Order not found.")
  await assertOrderAccess(user, order)

  const { updated, refunds } = await transition({ model: GiftOrder, machine: giftMachine, doc: order, to, actor: user.role, note })
  if (refunds) await refund("gift", order._id)

  const message = GIFT_MESSAGES[to]
  if (message && user.role !== "customer") await notify(order.customer, `Gift ${order.reference}: ${humanize(to)}`, message, `/gifts/orders/${order._id}`)
  if (user.role === "customer") {
    const vendor = await Vendor.findById(order.vendor).lean()
    if (vendor) await notify(vendor.user, `Order ${order.reference} cancelled`, "The customer cancelled this order before you accepted it.", `/vendor/orders/${order._id}`)
  }
  return updated
}

// ------------------------------------------------------------------ bookings

export async function requestBooking(customerId: string, input: Pick<z.infer<typeof bookingSchema>, "offeringId" | "recipientId" | "date" | "timeSlot" | "notes">, opts: OrderOptions = {}) {
  const [recipient, offering] = await Promise.all([
    ownedRecipient(customerId, input.recipientId),
    Offering.findOne({ _id: input.offeringId, active: true }).lean(),
  ])
  if (!offering) throw new AppError("This service is no longer available.")
  const vendor = await Vendor.findOne({ _id: offering.vendor, status: "approved", kind: "services" }).lean()
  if (!vendor) throw new AppError("This provider isn't taking bookings right now.")
  if (!vendor.serviceCities.includes(recipient.city)) {
    throw new AppError(`${vendor.businessName} doesn't work in ${recipient.city}. Choose a provider that does.`)
  }
  const clash = await Booking.exists({
    vendor: vendor._id,
    date: input.date,
    timeSlot: input.timeSlot,
    status: { $in: ["requested", "confirmed", "in_progress"] },
  })
  if (clash) throw new AppError("That time slot was just taken. Please pick another one.")

  const feeCents = serviceFeeCents(offering.priceCents)
  const booking = await Booking.create({
    reference: makeReference("BK"),
    customer: customerId,
    vendor: vendor._id,
    offering: offering._id,
    offeringTitle: offering.title,
    category: offering.category,
    recipient: snapshot(recipient),
    date: input.date,
    timeSlot: input.timeSlot,
    notes: input.notes,
    priceCents: offering.priceCents,
    feeCents,
    totalCents: offering.priceCents + feeCents,
    status: bookingMachine.initial,
    plan: opts.planId,
    events: [{ status: bookingMachine.initial, actor: opts.planId ? "system" : "customer" }],
  })

  const result = await charge(
    { kind: "booking", id: booking._id, reference: booking.reference, customer: booking.customer, description: `${offering.title} for ${recipient.fullName}` },
    booking.totalCents,
    opts.source,
  )
  const { updated } = await transition({
    model: Booking,
    machine: bookingMachine,
    doc: booking.toObject(),
    to: result.ok ? "requested" : "payment_failed",
    actor: "system",
    note: result.ok ? undefined : result.reason,
  })
  if (result.ok) {
    await notify(vendor.user, "New booking request", `${booking.reference}: ${offering.title} on ${formatDate(input.date)}, ${input.timeSlot}, in ${recipient.city}.`, `/vendor/bookings/${booking._id}`)
  }
  return updated
}

const BOOKING_MESSAGES: Partial<Record<BookingStatus, string>> = {
  confirmed: "The provider confirmed your booking.",
  in_progress: "The provider has started the job.",
  completed: "The job is done. Leave a review to help other families.",
  declined: "The provider can't take this booking. You've been refunded in full.",
  cancelled: "The booking was cancelled and refunded in full.",
}

export async function updateBooking(user: { id: string; role: Actor }, bookingId: string, to: BookingStatus, note?: string) {
  const booking = await Booking.findById(bookingId).lean<BookingDoc>()
  if (!booking) throw new AppError("Booking not found.")
  await assertOrderAccess(user, booking)

  const { updated, refunds } = await transition({ model: Booking, machine: bookingMachine, doc: booking, to, actor: user.role, note })
  if (refunds) await refund("booking", booking._id)

  const message = BOOKING_MESSAGES[to]
  if (message && user.role !== "customer") await notify(booking.customer, `Booking ${booking.reference}: ${humanize(to)}`, message, `/services/bookings/${booking._id}`)
  if (user.role === "customer") {
    const vendor = await Vendor.findById(booking.vendor).lean()
    if (vendor) await notify(vendor.user, `Booking ${booking.reference} cancelled`, "The customer cancelled this booking.", `/vendor/bookings/${booking._id}`)
  }
  return updated
}

export async function reviewBooking(customerId: string, input: z.infer<typeof reviewSchema>) {
  const updated = await Booking.findOneAndUpdate(
    { _id: input.bookingId, customer: customerId, status: "completed", "review.rating": { $exists: false } },
    { $set: { review: { rating: input.rating, comment: input.comment, createdAt: new Date() } } },
    { new: true },
  ).lean<BookingDoc>()
  if (!updated) throw new AppError("You can review a booking once, after it's completed.")

  // Recompute from source data rather than incrementing, so the average can't drift.
  const [stats] = await Booking.aggregate<{ avg: number; count: number }>([
    { $match: { vendor: updated.vendor, "review.rating": { $exists: true } } },
    { $group: { _id: null, avg: { $avg: "$review.rating" }, count: { $sum: 1 } } },
  ])
  const vendor = await Vendor.findByIdAndUpdate(updated.vendor, {
    ratingAverage: Math.round((stats?.avg ?? 0) * 10) / 10,
    ratingCount: stats?.count ?? 0,
  })
  if (vendor) await notify(vendor.user, "New review", `${input.rating}★ for ${updated.offeringTitle} (${updated.reference}).`, `/vendor/bookings/${updated._id}`)
  return updated
}

// ------------------------------------------------------------------ access

export async function assertOrderAccess(user: { id: string; role: Actor }, order: { customer: Types.ObjectId; vendor: Types.ObjectId }) {
  if (user.role === "admin") return
  if (user.role === "customer" && order.customer.equals(oid(user.id))) return
  if (user.role === "vendor") {
    const vendor = await Vendor.findOne({ user: user.id }).select("_id").lean()
    if (vendor && order.vendor.equals(vendor._id)) return
  }
  // Same message as "not found" so ids can't be probed.
  throw new AppError("Not found.")
}
