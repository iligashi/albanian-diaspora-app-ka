"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { parseForm, runAction, type ActionState } from "@/lib/actions"
import { requireUser } from "@/lib/auth/session"
import { BOOKING_STATUSES, GIFT_STATUSES } from "@/lib/domain/workflow"
import { updateBooking, updateGiftOrder } from "@/lib/services/orders"
import { saveOffering, saveProduct, saveVendorProfile } from "@/lib/services/vendor"
import { idSchema, offeringSchema, productSchema, vendorProfileSchema } from "@/lib/validation"

const note = z.string().trim().max(300).optional()

export async function saveVendorProfileAction(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await requireUser("vendor")
    await saveVendorProfile(user.id, parseForm(vendorProfileSchema, formData, ["serviceCities"]))
    revalidatePath("/", "layout")
    return { ok: true, message: "Business profile saved" }
  })
}

/** Checkbox inputs only submit when ticked, so map presence to a boolean before validating. */
function withActive(formData: FormData) {
  const copy = new FormData()
  for (const [k, v] of formData.entries()) if (k !== "active") copy.append(k, v)
  return { data: copy, active: formData.get("active") === "on" }
}

export async function saveProductAction(productId: string | undefined, _: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await requireUser("vendor")
    const { data, active } = withActive(formData)
    const input = parseForm(productSchema.omit({ active: true }), data)
    await saveProduct(user.id, { ...input, active }, productId ? idSchema.parse(productId) : undefined)
    revalidatePath("/vendor/catalog")
    return { ok: true, message: productId ? "Product updated" : "Product added" }
  })
}

export async function saveOfferingAction(offeringId: string | undefined, _: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await requireUser("vendor")
    const { data, active } = withActive(formData)
    if (!data.get("durationMinutes")) data.delete("durationMinutes")
    const input = parseForm(offeringSchema.omit({ active: true }), data)
    await saveOffering(user.id, { ...input, active }, offeringId ? idSchema.parse(offeringId) : undefined)
    revalidatePath("/vendor/catalog")
    return { ok: true, message: offeringId ? "Service updated" : "Service added" }
  })
}

export async function vendorGiftAction(orderId: string, to: string, reason?: string): Promise<ActionState> {
  return runAction(async () => {
    const user = await requireUser("vendor")
    await updateGiftOrder({ id: user.id, role: "vendor" }, idSchema.parse(orderId), z.enum(GIFT_STATUSES).parse(to), note.parse(reason))
    revalidatePath("/vendor", "layout")
    return { ok: true, message: "Order updated. The customer has been notified." }
  })
}

export async function vendorBookingAction(bookingId: string, to: string, reason?: string): Promise<ActionState> {
  return runAction(async () => {
    const user = await requireUser("vendor")
    await updateBooking({ id: user.id, role: "vendor" }, idSchema.parse(bookingId), z.enum(BOOKING_STATUSES).parse(to), note.parse(reason))
    revalidatePath("/vendor", "layout")
    return { ok: true, message: "Booking updated. The customer has been notified." }
  })
}
