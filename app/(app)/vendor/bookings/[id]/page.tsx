import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { isValidObjectId } from "mongoose"
import { Star } from "lucide-react"
import { ProofGallery } from "@/components/shared/proof"
import { ProofUpload } from "../../proof-upload"
import { DetailList, PageHeader, Section, StatusBadge, Timeline } from "@/components/shared/primitives"
import { TransitionButtons } from "@/components/shared/transition-buttons"
import { requireUser } from "@/lib/auth/session"
import { availableActions, bookingMachine } from "@/lib/domain/workflow"
import { formatMoney } from "@/lib/money"
import { Booking } from "@/lib/models"
import { getVendorForUser } from "@/lib/services/vendor"
import { formatDate } from "@/lib/utils"
import { vendorBookingAction } from "../../actions"

export const metadata: Metadata = { title: "Booking" }

export default async function VendorBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("vendor")
  const vendor = await getVendorForUser(user.id)
  if (!vendor) redirect("/vendor")
  const { id } = await params
  if (!isValidObjectId(id)) notFound()
  const booking = await Booking.findOne({ _id: id, vendor: vendor._id }).lean()
  if (!booking) notFound()
  const actions = vendor.status === "approved" ? availableActions(bookingMachine, booking.status, "vendor") : []

  return (
    <>
      <PageHeader
        title={booking.offeringTitle}
        description={`${booking.reference} · ${formatDate(booking.date)}, ${booking.timeSlot}`}
        back={{ href: "/vendor/bookings", label: "Bookings" }}
        actions={<StatusBadge status={booking.status} className="text-sm" />}
      />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          {actions.length > 0 && (
            <Section title="Next step">
              <div className="p-5">
                <TransitionButtons actions={actions} run={vendorBookingAction.bind(null, booking._id.toString())} withNote />
              </div>
            </Section>
          )}
          {booking.review?.rating && (
            <Section title="Customer review">
              <div className="p-5">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={n <= booking.review!.rating! ? "size-5 fill-amber-400 text-amber-400" : "size-5 text-border"} />
                  ))}
                </div>
                {booking.review.comment && <p className="mt-2 text-sm">{booking.review.comment}</p>}
              </div>
            </Section>
          )}
          {["in_progress", "completed"].includes(booking.status) && (
            <Section title="Photos and report for the family">
              <ProofGallery photos={booking.proofPhotos ?? []} note={booking.reportNote} />
              {(booking.proofPhotos?.length ?? 0) < 6 && <ProofUpload kind="booking" orderId={booking._id.toString()} />}
            </Section>
          )}
          <Section title="Visit">
            <DetailList
              items={[
                ["Contact", booking.recipient.fullName],
                ["Phone", booking.recipient.phone],
                ["Address", `${booking.recipient.addressLine}, ${booking.recipient.city}`],
                ["When", `${formatDate(booking.date)}, ${booking.timeSlot}`],
                ["Customer notes", booking.notes],
                ["Your payout", <span key="payout" className="tabular font-semibold">{formatMoney(booking.priceCents)}</span>],
              ]}
            />
          </Section>
        </div>
        <Section title="Timeline" className="h-fit">
          <Timeline events={booking.events} />
        </Section>
      </div>
    </>
  )
}
