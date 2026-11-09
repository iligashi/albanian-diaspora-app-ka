import "server-only"
import type { z } from "zod"
import { Offering, Product, User, Vendor, type VendorDoc } from "../models"
import type { offeringSchema, productSchema, vendorProfileSchema } from "../validation"
import { AppError, notify } from "./core"

export async function getVendorForUser(userId: string) {
  return Vendor.findOne({ user: userId }).lean<VendorDoc>()
}

/** Vendors can only sell once an admin approves them. Used by every vendor write. */
async function approvedVendor(userId: string) {
  const vendor = await getVendorForUser(userId)
  if (!vendor) throw new AppError("Set up your business profile first.")
  if (vendor.status !== "approved") throw new AppError("Your business is waiting for approval.")
  return vendor
}

export async function saveVendorProfile(userId: string, input: z.infer<typeof vendorProfileSchema>) {
  const existing = await getVendorForUser(userId)
  if (existing) {
    if (existing.kind !== input.kind) throw new AppError("Contact support to change what your business sells.")
    await Vendor.updateOne({ _id: existing._id }, { $set: input })
    return
  }
  await Vendor.create({ ...input, user: userId, status: "pending" })
  const admins = await User.find({ role: "admin", status: "active" }).select("_id").lean()
  await Promise.all(
    admins.map((a) => notify(a._id, "New vendor application", `${input.businessName} (${input.kind}, ${input.city}) is waiting for review.`, "/admin/vendors")),
  )
}

export async function saveProduct(userId: string, input: z.infer<typeof productSchema>, productId?: string) {
  const vendor = await approvedVendor(userId)
  if (vendor.kind !== "gifts") throw new AppError("Only gift shops can list products.")
  const data = { name: input.name, category: input.category, priceCents: input.price, description: input.description, active: input.active }
  if (productId) {
    const res = await Product.updateOne({ _id: productId, vendor: vendor._id }, { $set: data })
    if (res.matchedCount === 0) throw new AppError("Product not found.")
    return
  }
  await Product.create({ ...data, vendor: vendor._id })
}

export async function saveOffering(userId: string, input: z.infer<typeof offeringSchema>, offeringId?: string) {
  const vendor = await approvedVendor(userId)
  if (vendor.kind !== "services") throw new AppError("Only service providers can list services.")
  const data = {
    title: input.title,
    category: input.category,
    priceCents: input.price,
    durationMinutes: input.durationMinutes,
    description: input.description,
    active: input.active,
  }
  if (offeringId) {
    const res = await Offering.updateOne({ _id: offeringId, vendor: vendor._id }, { $set: data })
    if (res.matchedCount === 0) throw new AppError("Service not found.")
    return
  }
  await Offering.create({ ...data, vendor: vendor._id })
}
