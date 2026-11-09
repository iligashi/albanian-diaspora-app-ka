import type { Metadata } from "next"
import Link from "next/link"
import { CalendarDays } from "lucide-react"
import { SubNav } from "@/components/shared/filters"
import { SERVICE_TABS } from "@/components/shared/nav"
import { EmptyState, PageHeader, StatusBadge } from "@/components/shared/primitives"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/auth/session"
import { formatMoney } from "@/lib/money"
import { Booking, Vendor } from "@/lib/models"
import { formatDate } from "@/lib/utils"

export const metadata: Metadata = { title: "Bookings" }

export default async function BookingsPage() {
  const user = await requireUser("customer")
  const bookings = await Booking.find({ customer: user.id }).sort({ date: -1 }).limit(100).lean()
  const vendors = new Map(
    (await Vendor.find({ _id: { $in: bookings.map((b) => b.vendor) } }).select("businessName").lean()).map((v) => [v._id.toString(), v.businessName]),
  )

  return (
    <>
      <PageHeader title="Home services" description="Every visit you've booked, past and upcoming." />
      <SubNav current="/services/bookings" items={SERVICE_TABS} />
      {bookings.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No bookings yet"
          description="Book a cleaner, electrician, plumber or carer for your family's home."
          action={
            <Button asChild>
              <Link href="/services">Find a service</Link>
            </Button>
          }
        />
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {bookings.map((b) => (
            <li key={b._id.toString()}>
              <Link href={`/services/bookings/${b._id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/40">
                <div className="hidden w-14 shrink-0 rounded-lg border text-center sm:block">
                  <p className="border-b bg-muted/50 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                    {new Intl.DateTimeFormat("en-GB", { month: "short" }).format(b.date)}
                  </p>
                  <p className="py-1 text-lg font-semibold">{b.date.getDate()}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{b.offeringTitle}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatDate(b.date)}, {b.timeSlot} · {b.recipient.fullName}, {b.recipient.city} · {vendors.get(b.vendor.toString())}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="tabular text-sm font-medium">{formatMoney(b.totalCents)}</span>
                  <StatusBadge status={b.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
