import "server-only"
import type { GiftCategory, ServiceCategory } from "./domain/catalog"
import { Offering, Product, Vendor } from "./models"

export type VendorSummary = { id: string; businessName: string; city: string; ratingAverage: number; ratingCount: number; serviceCities: string[] }

async function approvedVendors(kind: "gifts" | "services", city?: string) {
  const vendors = await Vendor.find({ kind, status: "approved", ...(city ? { serviceCities: city } : {}) }).lean()
  return new Map<string, VendorSummary>(
    vendors.map((v) => [
      v._id.toString(),
      {
        id: v._id.toString(),
        businessName: v.businessName,
        city: v.city,
        ratingAverage: v.ratingAverage,
        ratingCount: v.ratingCount,
        serviceCities: v.serviceCities,
      },
    ]),
  )
}

export async function browseProducts(filters: { category?: GiftCategory; city?: string }) {
  const vendors = await approvedVendors("gifts", filters.city)
  const products = await Product.find({
    active: true,
    vendor: { $in: [...vendors.keys()] },
    ...(filters.category ? { category: filters.category } : {}),
  })
    .sort({ createdAt: -1 })
    .lean()
  return products.map((p) => ({
    id: p._id.toString(),
    name: p.name,
    description: p.description ?? "",
    category: p.category,
    priceCents: p.priceCents,
    vendor: vendors.get(p.vendor.toString())!,
  }))
}

export async function browseOfferings(filters: { category?: ServiceCategory; city?: string }) {
  const vendors = await approvedVendors("services", filters.city)
  const offerings = await Offering.find({
    active: true,
    vendor: { $in: [...vendors.keys()] },
    ...(filters.category ? { category: filters.category } : {}),
  })
    .sort({ createdAt: -1 })
    .lean()
  return offerings.map((o) => ({
    id: o._id.toString(),
    title: o.title,
    description: o.description ?? "",
    category: o.category,
    priceCents: o.priceCents,
    durationMinutes: o.durationMinutes ?? null,
    vendor: vendors.get(o.vendor.toString())!,
  }))
}
