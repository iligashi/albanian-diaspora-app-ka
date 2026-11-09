import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { CalendarDays } from "lucide-react"
import { SubNav } from "@/components/shared/filters"
import { EmptyState, PageHeader, StatusBadge } from "@/components/shared/primitives"
import { requireUser } from "@/lib/auth/session"
import { formatMoney } from "@/lib/money"
import { Booking } from "@/lib/models"
import { getVendorForUser } from "@/lib/services/vendor"
import { formatDate } from "@/lib/utils"
import { VENDOR_BOOKING_QUEUE } from "@/lib/vendor-queries"

export const metadata: Metadata = { title: "Bookings" }

type View = keyof typeof VENDOR_BOOKING_QUEUE

export default async function VendorBookingsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const user = await requireUser("vendor")
  const vendor = await getVendorForUser(user.id)
  if (!vendor || vendor.kind !== "services") redirect("/vendor")
  const { view: rawView } = await searchParams
  const view: View = rawView === "active" || rawView === "done" ? rawView : "action"
  const bookings = await Booking.find({ vendor: vendor._id, status: { $in: VENDOR_BOOKING_QUEUE[view] } })
    .sort(view === "done" ? { updatedAt: -1 } : { date: 1 })
    .limit(100)
    .lean()

  return (
    <>
      <PageHeader title="Bookings" description="Confirm or decline new requests. Declining refunds the customer automatically." />
      <SubNav
        current={`/vendor/bookings?view=${view}`}
        items={[
          { href: "/vendor/bookings?view=action", label: "Requests" },
          { href: "/vendor/bookings?view=active", label: "Upcoming" },
          { href: "/vendor/bookings?view=done", label: "Finished" },
        ]}
      />
      {bookings.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Nothing here" description={view === "action" ? "No new requests. We'll notify you when one comes in." : "No bookings in this list."} />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Service</th>
                <th className="px-5 py-3 font-medium">When</th>
                <th className="px-5 py-3 font-medium">Where</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Your payout</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {bookings.map((b) => (
                <tr key={b._id.toString()} className="hover:bg-muted/40">
                  <td className="px-5 py-3">
                    <Link href={`/vendor/bookings/${b._id}`} className="font-medium hover:underline">
                      {b.offeringTitle}
                    </Link>
                    <p className="font-mono text-xs text-muted-foreground">{b.reference}</p>
                  </td>
                  <td className="px-5 py-3">
                    {formatDate(b.date)}
                    <p className="text-xs text-muted-foreground">{b.timeSlot}</p>
                  </td>
                  <td className="px-5 py-3">{b.recipient.city}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="tabular px-5 py-3 text-right font-medium">{formatMoney(b.priceCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
