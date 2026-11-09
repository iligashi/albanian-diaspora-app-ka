import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { isValidObjectId } from "mongoose"
import { MapPin, Users } from "lucide-react"
import { EmptyState, PageHeader } from "@/components/shared/primitives"
import { Rating } from "@/components/shared/rating"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/auth/session"
import { formatMoney } from "@/lib/money"
import { Product, Vendor } from "@/lib/models"
import { recipientOptions } from "@/lib/recipient-options"
import { humanize } from "@/lib/utils"
import { GiftOrderForm } from "./gift-order-form"

export const metadata: Metadata = { title: "Send a gift" }

export default async function GiftProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const user = await requireUser("customer")
  const { productId } = await params
  if (!isValidObjectId(productId)) notFound()
  const product = await Product.findOne({ _id: productId, active: true }).lean()
  if (!product) notFound()
  const vendor = await Vendor.findOne({ _id: product.vendor, status: "approved" }).lean()
  if (!vendor) notFound()
  const recipients = await recipientOptions(user.id)

  return (
    <>
      <PageHeader title={product.name} back={{ href: "/gifts", label: "Gifts" }} description={`${humanize(product.category)} · ${formatMoney(product.priceCents)}`} />
      <div className="mb-6 rounded-xl border bg-card p-5">
        <p className="text-sm">{product.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-4 text-sm">
          <span className="font-medium">{vendor.businessName}</span>
          <Rating average={vendor.ratingAverage} count={vendor.ratingCount} />
          <span className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="size-3.5" /> Delivers to {vendor.serviceCities.join(", ")}
          </span>
        </div>
      </div>

      {recipients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Add a family member first"
          description="We need to know who the gift is for and where to deliver it."
          action={
            <Button asChild>
              <Link href="/family">Add family member</Link>
            </Button>
          }
        />
      ) : (
        <GiftOrderForm
          product={{ id: product._id.toString(), name: product.name, priceCents: product.priceCents }}
          recipients={recipients}
          servedCities={vendor.serviceCities}
          vendorName={vendor.businessName}
        />
      )}
    </>
  )
}
