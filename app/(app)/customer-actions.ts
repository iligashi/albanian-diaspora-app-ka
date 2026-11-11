"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { parseForm, runAction, type ActionState } from "@/lib/actions"
import { requireUser } from "@/lib/auth/session"
import { z } from "zod"
import { BOOKING_STATUSES, GIFT_STATUSES } from "@/lib/domain/workflow"
import { deleteRecipient, payBill, placeGiftOrder, requestBooking, reviewBooking, saveRecipient, updateBooking, updateGiftOrder } from "@/lib/services/orders"
import { getBillProvider } from "@/lib/domain/catalog"
import { parsePaymentSource } from "@/lib/services/core"
import { attachVoiceNote, readUpload } from "@/lib/services/media"
import { createPlan } from "@/lib/services/plans"
import { billSchema, bookingSchema, giftOrderSchema, idSchema, recipientSchema, reviewSchema } from "@/lib/validation"

export async function saveRecipientAction(recipientId: string | undefined, _: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await requireUser("customer")
    const input = parseForm(recipientSchema, formData)
    await saveRecipient(user.id, input, recipientId ? idSchema.parse(recipientId) : undefined)
    revalidatePath("/family")
    return { ok: true, message: recipientId ? "Changes saved" : `${input.fullName} added` }
  })
}

export async function deleteRecipientAction(recipientId: string): Promise<ActionState> {
  return runAction(async () => {
    const user = await requireUser("customer")
    await deleteRecipient(user.id, idSchema.parse(recipientId))
    revalidatePath("/family")
    return { ok: true, message: "Family member removed" }
  })
}

/** Creates a recurring plan from the order the customer just placed, when they chose "Repeat". */
async function maybeCreatePlan(customerId: string, repeat: string, plan: Parameters<typeof createPlan>[1]) {
  if (repeat === "once") return
  await createPlan(customerId, plan)
}

export async function payBillAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let id = ""
  const result = await runAction(async () => {
    const user = await requireUser("customer")
    const input = parseForm(billSchema, formData)
    const bill = await payBill(user.id, input, { source: parsePaymentSource(input.payWith) })
    id = bill._id.toString()
    if (bill.status !== "payment_failed" && input.repeat !== "once") {
      await maybeCreatePlan(user.id, input.repeat, {
        kind: "bill",
        title: `${getBillProvider(input.provider)!.name} for ${bill.recipient.fullName}`,
        recipientId: input.recipientId,
        interval: input.repeat,
        payWith: input.payWith,
        firstOccurrence: new Date(),
        bill: { provider: input.provider, accountNumber: input.accountNumber, amountCents: input.amount },
      })
    }
  })
  if (result.ok) redirect(`/bills/${id}?new=1`)
  return result
}

export async function placeGiftOrderAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let id = ""
  const result = await runAction(async () => {
    const user = await requireUser("customer")
    const input = parseForm(giftOrderSchema, formData)
    // Check the voice note before charging, so a bad file never leaves a paid order behind.
    const voice = await readUpload(formData.get("voiceNote"), "voice")
    const order = await placeGiftOrder(user.id, input, { source: parsePaymentSource(input.payWith) })
    id = order._id.toString()
    if (order.status === "payment_failed") return
    if (voice) await attachVoiceNote(user.id, order._id, voice)
    if (input.repeat !== "once") {
      await maybeCreatePlan(user.id, input.repeat, {
        kind: "gift",
        title: `${order.items[0].name} for ${order.recipient.fullName}`,
        recipientId: input.recipientId,
        interval: input.repeat,
        payWith: input.payWith,
        firstOccurrence: input.deliveryDate,
        gift: { productId: input.productId, quantity: input.quantity, message: input.message },
      })
    }
  })
  if (result.ok) redirect(`/gifts/orders/${id}?new=1`)
  return result
}

export async function requestBookingAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let id = ""
  const result = await runAction(async () => {
    const user = await requireUser("customer")
    const input = parseForm(bookingSchema, formData)
    const booking = await requestBooking(user.id, input, { source: parsePaymentSource(input.payWith) })
    id = booking._id.toString()
    if (booking.status !== "payment_failed" && input.repeat !== "once") {
      await maybeCreatePlan(user.id, input.repeat, {
        kind: "booking",
        title: `${booking.offeringTitle} for ${booking.recipient.fullName}`,
        recipientId: input.recipientId,
        interval: input.repeat,
        payWith: input.payWith,
        firstOccurrence: input.date,
        booking: { offeringId: input.offeringId, timeSlot: input.timeSlot, notes: input.notes },
      })
    }
  })
  if (result.ok) redirect(`/services/bookings/${id}?new=1`)
  return result
}

export async function cancelGiftOrderAction(orderId: string, to: string): Promise<ActionState> {
  return runAction(async () => {
    const user = await requireUser("customer")
    await updateGiftOrder({ id: user.id, role: "customer" }, idSchema.parse(orderId), z.enum(GIFT_STATUSES).parse(to))
    revalidatePath(`/gifts/orders/${orderId}`)
    return { ok: true, message: "Order cancelled. Your refund is on its way." }
  })
}

export async function cancelBookingAction(bookingId: string, to: string): Promise<ActionState> {
  return runAction(async () => {
    const user = await requireUser("customer")
    await updateBooking({ id: user.id, role: "customer" }, idSchema.parse(bookingId), z.enum(BOOKING_STATUSES).parse(to))
    revalidatePath(`/services/bookings/${bookingId}`)
    return { ok: true, message: "Booking cancelled. Your refund is on its way." }
  })
}

export async function reviewBookingAction(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await requireUser("customer")
    const input = parseForm(reviewSchema, formData)
    await reviewBooking(user.id, input)
    revalidatePath(`/services/bookings/${input.bookingId}`)
    return { ok: true, message: "Thanks for your review" }
  })
}
