/**
 * End-to-end checks of the order workflows against a real (in-memory) MongoDB.
 * Run with `npm run test:integration` (uses mongodb-memory-server).
 */
import { after, before, describe, it } from "node:test"
import assert from "node:assert/strict"
import mongoose from "mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"

process.env.SESSION_SECRET ??= "integration-test-secret-integration-test-secret"
process.env.MONGODB_URI ??= "mongodb://unused"

// Loaded in before(), after the env is set (lib/env reads it on first use).
let Bill: typeof import("../models").Bill
let Booking: typeof import("../models").Booking
let Notification: typeof import("../models").Notification
let Offering: typeof import("../models").Offering
let Product: typeof import("../models").Product
let Recipient: typeof import("../models").Recipient
let Transaction: typeof import("../models").Transaction
let User: typeof import("../models").User
let Vendor: typeof import("../models").Vendor
let orders: typeof import("./orders")
let admin: typeof import("./admin")
let AppError: typeof import("./core").AppError
const DEMO_ACCOUNTS = { customer: "arben@demo.test", giftVendor: "flora@demo.test", serviceVendor: "pastrim@demo.test" }

let server: MongoMemoryServer
let customerId: string
let flora: { id: string; userId: string }
let pastrim: { id: string; userId: string }
let recipientPrishtina: string
let recipientDrenas: string

function inDays(n: number) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + n)
  d.setUTCHours(12, 0, 0, 0)
  return d
}

before(async () => {
  ;({ Bill, Booking, Notification, Offering, Product, Recipient, Transaction, User, Vendor } = await import("../models"))
  orders = await import("./orders")
  admin = await import("./admin")
  ;({ AppError } = await import("./core"))
  const { seedDemoData } = await import("../seed")
  server = await MongoMemoryServer.create()
  await mongoose.connect(server.getUri("workflow-tests"))
  await seedDemoData()
  const customer = await User.findOne({ email: DEMO_ACCOUNTS.customer }).lean()
  customerId = customer!._id.toString()
  const recipients = await Recipient.find({ owner: customerId }).lean()
  recipientPrishtina = recipients.find((r) => r.city === "Prishtinë")!._id.toString()
  recipientDrenas = recipients.find((r) => r.city === "Drenas")!._id.toString()
  for (const [email, set] of [
    [DEMO_ACCOUNTS.giftVendor, (v: { id: string; userId: string }) => (flora = v)],
    [DEMO_ACCOUNTS.serviceVendor, (v: { id: string; userId: string }) => (pastrim = v)],
  ] as const) {
    const user = await User.findOne({ email }).lean()
    const vendor = await Vendor.findOne({ user: user!._id }).lean()
    set({ id: vendor!._id.toString(), userId: user!._id.toString() })
  }
})

after(async () => {
  await mongoose.disconnect()
  await server?.stop()
})

describe("bills", () => {
  it("charges the customer, then lets an admin settle with a receipt", async () => {
    const bill = await orders.payBill(customerId, { recipientId: recipientPrishtina, provider: "ipko", accountNumber: "C-555", amount: 2990, period: undefined })
    assert.equal(bill.status, "paid")
    assert.equal(bill.totalCents, 2990 + 99)
    const charge = await Transaction.findOne({ subjectId: bill._id, type: "charge" }).lean()
    assert.equal(charge?.amountCents, bill.totalCents)

    await admin.settleBill(bill._id.toString(), "IPKO-123")
    const settled = await Bill.findById(bill._id).lean()
    assert.equal(settled?.status, "settled")
    assert.equal(settled?.settlementReference, "IPKO-123")
    assert.ok(await Notification.exists({ user: customerId, title: new RegExp(bill.reference) }))
  })

  it("refunds a bill exactly once", async () => {
    const bill = await orders.payBill(customerId, { recipientId: recipientPrishtina, provider: "kesco", accountNumber: "1", amount: 5000, period: undefined })
    await admin.refundBill(bill._id.toString(), "Wrong customer number")
    await assert.rejects(admin.refundBill(bill._id.toString(), "again"))
    const refunds = await Transaction.find({ subjectId: bill._id, type: "refund" }).lean()
    assert.equal(refunds.length, 1)
    assert.equal(refunds[0].amountCents, bill.totalCents)
  })

  it("rejects paying for someone who isn't your family member", async () => {
    const stranger = await Recipient.create({ owner: new mongoose.Types.ObjectId(), fullName: "X", relationship: "other", city: "Prizren", addressLine: "x" })
    await assert.rejects(
      orders.payBill(customerId, { recipientId: stranger._id.toString(), provider: "kesco", accountNumber: "1", amount: 100, period: undefined }),
      AppError,
    )
  })
})

describe("gift orders", () => {
  it("walks from placed to delivered, driven by the vendor", async () => {
    const product = await Product.findOne({ vendor: flora.id }).lean()
    const order = await orders.placeGiftOrder(customerId, {
      productId: product!._id.toString(),
      quantity: 2,
      recipientId: recipientPrishtina,
      deliveryDate: inDays(3),
      message: "Për ty",
    })
    assert.equal(order.status, "placed")
    assert.equal(order.subtotalCents, product!.priceCents * 2)

    const vendor = { id: flora.userId, role: "vendor" as const }
    await orders.updateGiftOrder(vendor, order._id.toString(), "accepted")
    // Once accepted, the customer can no longer cancel.
    await assert.rejects(orders.updateGiftOrder({ id: customerId, role: "customer" }, order._id.toString(), "cancelled"))
    await orders.updateGiftOrder(vendor, order._id.toString(), "out_for_delivery")
    const done = await orders.updateGiftOrder(vendor, order._id.toString(), "delivered")
    assert.equal(done.status, "delivered")
    assert.deepEqual(
      done.events.map((e) => e.status),
      ["awaiting_payment", "placed", "accepted", "out_for_delivery", "delivered"],
    )
  })

  it("refunds when the customer cancels before the shop accepts", async () => {
    const product = await Product.findOne({ vendor: flora.id }).lean()
    const order = await orders.placeGiftOrder(customerId, { productId: product!._id.toString(), quantity: 1, recipientId: recipientPrishtina, deliveryDate: inDays(2), message: undefined })
    await orders.updateGiftOrder({ id: customerId, role: "customer" }, order._id.toString(), "cancelled")
    const refund = await Transaction.findOne({ subjectId: order._id, type: "refund" }).lean()
    assert.equal(refund?.amountCents, order.totalCents)
  })

  it("won't let another vendor touch the order", async () => {
    const product = await Product.findOne({ vendor: flora.id }).lean()
    const order = await orders.placeGiftOrder(customerId, { productId: product!._id.toString(), quantity: 1, recipientId: recipientPrishtina, deliveryDate: inDays(2), message: undefined })
    await assert.rejects(orders.updateGiftOrder({ id: pastrim.userId, role: "vendor" }, order._id.toString(), "accepted"), /Not found/)
  })

  it("refuses delivery to a town the shop doesn't cover", async () => {
    const dukagjini = await Vendor.findOne({ businessName: "Ëmbëlsira Dukagjini" }).lean()
    const product = await Product.findOne({ vendor: dukagjini!._id }).lean()
    await assert.rejects(
      orders.placeGiftOrder(customerId, { productId: product!._id.toString(), quantity: 1, recipientId: recipientDrenas, deliveryDate: inDays(2), message: undefined }),
      /doesn't deliver to Drenas/,
    )
  })
})

describe("bookings", () => {
  it("goes requested → confirmed → in progress → completed → reviewed, updating the vendor rating", async () => {
    const offering = await Offering.findOne({ vendor: pastrim.id }).lean()
    const booking = await orders.requestBooking(customerId, {
      offeringId: offering!._id.toString(),
      recipientId: recipientDrenas,
      date: inDays(10),
      timeSlot: "14:00–16:00",
      notes: undefined,
    })
    assert.equal(booking.status, "requested")

    const vendor = { id: pastrim.userId, role: "vendor" as const }
    await orders.updateBooking(vendor, booking._id.toString(), "confirmed")
    await orders.updateBooking(vendor, booking._id.toString(), "in_progress")
    await orders.updateBooking(vendor, booking._id.toString(), "completed")
    await orders.reviewBooking(customerId, { bookingId: booking._id.toString(), rating: 4, comment: "Shumë mirë" })
    await assert.rejects(orders.reviewBooking(customerId, { bookingId: booking._id.toString(), rating: 1, comment: undefined }), /once/)

    const v = await Vendor.findById(pastrim.id).lean()
    assert.equal(v?.ratingCount, 1)
    assert.equal(v?.ratingAverage, 4)
  })

  it("blocks double-booking the same vendor slot", async () => {
    const offering = await Offering.findOne({ vendor: pastrim.id }).lean()
    const input = { offeringId: offering!._id.toString(), recipientId: recipientDrenas, date: inDays(12), timeSlot: "08:00–10:00" as const, notes: undefined }
    await orders.requestBooking(customerId, input)
    await assert.rejects(orders.requestBooking(customerId, input), /just taken/)
  })

  it("only lets one of two simultaneous transitions win", async () => {
    const offering = await Offering.findOne({ vendor: pastrim.id }).lean()
    const booking = await orders.requestBooking(customerId, {
      offeringId: offering!._id.toString(),
      recipientId: recipientDrenas,
      date: inDays(14),
      timeSlot: "10:00–12:00",
      notes: undefined,
    })
    const results = await Promise.allSettled([
      orders.updateBooking({ id: pastrim.userId, role: "vendor" }, booking._id.toString(), "declined"),
      orders.updateBooking({ id: customerId, role: "customer" }, booking._id.toString(), "cancelled"),
    ])
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1)
    const refunds = await Transaction.countDocuments({ subjectId: booking._id, type: "refund" })
    assert.equal(refunds, 1)
    const final = await Booking.findById(booking._id).lean()
    assert.ok(final && ["declined", "cancelled"].includes(final.status))
  })
})

describe("vendor approval", () => {
  it("hides suspended vendors' listings from new orders", async () => {
    await admin.setVendorStatus(flora.id, "suspended", "Paperwork expired")
    const product = await Product.findOne({ vendor: flora.id }).lean()
    await assert.rejects(
      orders.placeGiftOrder(customerId, { productId: product!._id.toString(), quantity: 1, recipientId: recipientPrishtina, deliveryDate: inDays(2), message: undefined }),
      /isn't taking orders/,
    )
    await admin.setVendorStatus(flora.id, "approved")
  })
})
