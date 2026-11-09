"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { parseForm, runAction, type ActionState } from "@/lib/actions"
import { requireUser } from "@/lib/auth/session"
import { z } from "zod"
import { BOOKING_STATUSES, GIFT_STATUSES } from "@/lib/domain/workflow"
import { deleteRecipient, payBill, placeGiftOrder, requestBooking, reviewBooking, saveRecipient, updateBooking, updateGiftOrder } from "@/lib/services/orders"
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

export async function payBillAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let id = ""
  const result = await runAction(async () => {
    const user = await requireUser("customer")
    const bill = await payBill(user.id, parseForm(billSchema, formData))
    id = bill._id.toString()
  })
  if (result.ok) redirect(`/bills/${id}?new=1`)
  return result
}

export async function placeGiftOrderAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let id = ""
  const result = await runAction(async () => {
    const user = await requireUser("customer")
    const order = await placeGiftOrder(user.id, parseForm(giftOrderSchema, formData))
    id = order._id.toString()
  })
  if (result.ok) redirect(`/gifts/orders/${id}?new=1`)
  return result
}

export async function requestBookingAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let id = ""
  const result = await runAction(async () => {
    const user = await requireUser("customer")
    const booking = await requestBooking(user.id, parseForm(bookingSchema, formData))
    id = booking._id.toString()
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
