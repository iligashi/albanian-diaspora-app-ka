import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { isValidObjectId } from "mongoose"
import { Clock, MapPin, Users } from "lucide-react"
import { EmptyState, PageHeader } from "@/components/shared/primitives"
import { Rating } from "@/components/shared/rating"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/auth/session"
import { formatMoney } from "@/lib/money"
import { Offering, Vendor } from "@/lib/models"
import { recipientOptions } from "@/lib/recipient-options"
import { humanize } from "@/lib/utils"
import { BookingForm } from "./booking-form"

export const metadata: Metadata = { title: "Book a service" }

export default async function OfferingPage({ params }: { params: Promise<{ offeringId: string }> }) {
  const user = await requireUser("customer")
  const { offeringId } = await params
  if (!isValidObjectId(offeringId)) notFound()
  const offering = await Offering.findOne({ _id: offeringId, active: true }).lean()
  if (!offering) notFound()
  const vendor = await Vendor.findOne({ _id: offering.vendor, status: "approved" }).lean()
  if (!vendor) notFound()
  const recipients = await recipientOptions(user.id)

  return (
    <>
      <PageHeader title={offering.title} back={{ href: "/services", label: "Home services" }} description={`${humanize(offering.category)} · ${formatMoney(offering.priceCents)}`} />
      <div className="mb-6 rounded-xl border bg-card p-5">
        <p className="text-sm">{offering.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-4 text-sm">
          <span className="font-medium">{vendor.businessName}</span>
          <Rating average={vendor.ratingAverage} count={vendor.ratingCount} />
          {offering.durationMinutes && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="size-3.5" /> About {Math.round(offering.durationMinutes / 60) || 1} hour(s)
            </span>
          )}
          <span className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="size-3.5" /> Works in {vendor.serviceCities.join(", ")}
          </span>
        </div>
        {vendor.description && <p className="mt-3 text-sm text-muted-foreground">{vendor.description}</p>}
      </div>

      {recipients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Add a family member first"
          description="We need to know whose home the provider is visiting."
          action={
            <Button asChild>
              <Link href="/family">Add family member</Link>
            </Button>
          }
        />
      ) : (
        <BookingForm
          offering={{ id: offering._id.toString(), title: offering.title, priceCents: offering.priceCents }}
          recipients={recipients}
          servedCities={vendor.serviceCities}
          vendorName={vendor.businessName}
        />
      )}
    </>
  )
}
