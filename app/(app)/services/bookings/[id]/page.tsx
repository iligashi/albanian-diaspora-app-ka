import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { isValidObjectId } from "mongoose"
import { CheckCircle2, Star } from "lucide-react"
import { ProofGallery, VoiceNote } from "@/components/shared/proof"
import { DetailList, PageHeader, PriceBreakdown, Section, StatusBadge, Timeline } from "@/components/shared/primitives"
import { ProgressSteps } from "@/components/shared/progress-steps"
import { TransitionButtons } from "@/components/shared/transition-buttons"
import { requireUser } from "@/lib/auth/session"
import { availableActions, BOOKING_STEPS, bookingMachine, lastProgressStatus } from "@/lib/domain/workflow"
import { formatMoney } from "@/lib/money"
import { Booking, Vendor } from "@/lib/models"
import { formatDate, humanize } from "@/lib/utils"
import { cancelBookingAction } from "../../../customer-actions"
import { ReviewForm } from "./review-form"

export const metadata: Metadata = { title: "Booking" }

export default async function BookingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
  const user = await requireUser("customer")
  const [{ id }, { new: isNew }] = await Promise.all([params, searchParams])
  if (!isValidObjectId(id)) notFound()
  const booking = await Booking.findOne({ _id: id, customer: user.id }).lean()
  if (!booking) notFound()
  const vendor = await Vendor.findById(booking.vendor).lean()

  const ended = ["declined", "cancelled"].includes(booking.status) ? humanize(booking.status) : undefined
  const actions = availableActions(bookingMachine, booking.status, "customer")

  return (
    <>
      <PageHeader
        title={booking.offeringTitle}
        description={`${booking.reference} · ${formatDate(booking.date)}, ${booking.timeSlot}`}
        back={{ href: "/services/bookings", label: "My bookings" }}
        actions={<StatusBadge status={booking.status} className="text-sm" />}
      />

      {isNew && booking.status === "requested" && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
          <p>
            <strong>Booking requested.</strong> {vendor?.businessName} will confirm shortly. We&apos;ll let you know.
          </p>
        </div>
      )}

      {booking.status !== "payment_failed" && (
        <div className="mb-6 rounded-xl border bg-card p-5">
          <ProgressSteps steps={BOOKING_STEPS} status={ended ? lastProgressStatus(booking.events, BOOKING_STEPS) : booking.status} endedAs={ended} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          {booking.status === "completed" && (
            <Section title="Your review">
              {booking.review?.rating ? (
                <div className="p-5">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={n <= booking.review!.rating! ? "size-5 fill-amber-400 text-amber-400" : "size-5 text-border"} />
                    ))}
                  </div>
                  {booking.review.comment && <p className="mt-2 text-sm">{booking.review.comment}</p>}
                </div>
              ) : (
                <ReviewForm bookingId={booking._id.toString()} />
              )}
            </Section>
          )}
          {(booking.proofPhotos?.length || booking.reportNote || ["in_progress", "completed"].includes(booking.status)) && (
            <Section title="Report from the visit">
              <ProofGallery photos={booking.proofPhotos ?? []} note={booking.reportNote} emptyText="The provider can share photos and a short report from the visit." />
            </Section>
          )}
          <Section title="Visit">
            <DetailList
              items={[
                ["Where", `${booking.recipient.fullName}, ${booking.recipient.addressLine}, ${booking.recipient.city}`],
                ["When", `${formatDate(booking.date)}, ${booking.timeSlot}`],
                ["Provider", vendor ? `${vendor.businessName} · ${vendor.phone}` : null],
                ["Category", humanize(booking.category)],
                ["Your notes", booking.notes],
              ]}
            />
          </Section>
          <Section title="Payment">
            <div className="space-y-4 p-5">
              <PriceBreakdown
                lines={[
                  [booking.offeringTitle, formatMoney(booking.priceCents)],
                  ["Service fee", formatMoney(booking.feeCents)],
                ]}
                total={formatMoney(booking.totalCents)}
              />
              {actions.length > 0 && (
                <div className="border-t pt-4">
                  <p className="mb-3 text-xs text-muted-foreground">Plans changed? Cancel before the job starts for a full refund.</p>
                  <TransitionButtons actions={actions} run={cancelBookingAction.bind(null, booking._id.toString())} />
                </div>
              )}
            </div>
          </Section>
        </div>
        <Section title="Timeline" className="h-fit">
          <Timeline events={booking.events} />
        </Section>
      </div>
    </>
  )
}
