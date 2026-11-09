import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { BellRing, CheckCircle2, Clock3, Hourglass, PauseCircle, Star, Wallet } from "lucide-react"
import { EmptyState, PageHeader, Section, StatCard, StatusBadge } from "@/components/shared/primitives"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/auth/session"
import { formatMoney } from "@/lib/money"
import { Booking, GiftOrder, Offering, Product } from "@/lib/models"
import { getVendorForUser } from "@/lib/services/vendor"
import { formatDate } from "@/lib/utils"
import { VENDOR_BOOKING_QUEUE, VENDOR_GIFT_QUEUE, vendorOverview } from "@/lib/vendor-queries"

export const metadata: Metadata = { title: "Vendor overview" }

export default async function VendorHome() {
  const user = await requireUser("vendor")
  const vendor = await getVendorForUser(user.id)
  if (!vendor) redirect("/vendor/profile")

  if (vendor.status !== "approved") {
    const pending = vendor.status === "pending"
    return (
      <>
        <PageHeader title={vendor.businessName} actions={<StatusBadge status={vendor.status} className="text-sm" />} />
        <EmptyState
          icon={pending ? Hourglass : PauseCircle}
          title={pending ? "Your application is being reviewed" : "Your business is suspended"}
          description={
            pending
              ? "We check every vendor before they go live, usually within one working day. We'll notify you here as soon as you're approved."
              : vendor.reviewNote || "Contact support to find out more."
          }
          action={
            <Button asChild variant="outline">
              <Link href="/vendor/profile">Review your profile</Link>
            </Button>
          }
        />
      </>
    )
  }

  const isGifts = vendor.kind === "gifts"
  const [stats, catalogCount, queue] = await Promise.all([
    vendorOverview(vendor._id, vendor.kind),
    isGifts ? Product.countDocuments({ vendor: vendor._id, active: true }) : Offering.countDocuments({ vendor: vendor._id, active: true }),
    isGifts
      ? GiftOrder.find({ vendor: vendor._id, status: { $in: [...VENDOR_GIFT_QUEUE.action, ...VENDOR_GIFT_QUEUE.active] } })
          .sort({ deliveryDate: 1 })
          .limit(8)
          .lean()
          .then((orders) =>
            orders.map((o) => ({
              id: o._id.toString(),
              href: `/vendor/orders/${o._id}`,
              title: o.items.map((i) => `${i.name} × ${i.quantity}`).join(", "),
              meta: `${o.recipient.city} · deliver ${formatDate(o.deliveryDate)}`,
              status: o.status,
            })),
          )
      : Booking.find({ vendor: vendor._id, status: { $in: [...VENDOR_BOOKING_QUEUE.action, ...VENDOR_BOOKING_QUEUE.active] } })
          .sort({ date: 1 })
          .limit(8)
          .lean()
          .then((bookings) =>
            bookings.map((b) => ({
              id: b._id.toString(),
              href: `/vendor/bookings/${b._id}`,
              title: b.offeringTitle,
              meta: `${b.recipient.city} · ${formatDate(b.date)}, ${b.timeSlot}`,
              status: b.status,
            })),
          ),
  ])
  const listHref = isGifts ? "/vendor/orders" : "/vendor/bookings"

  return (
    <>
      <PageHeader title={vendor.businessName} description={isGifts ? "Gift shop" : "Home services"} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Needs your response" value={stats.needsAction} icon={BellRing} href={`${listHref}?view=action`} />
        <StatCard label="In progress" value={stats.active} icon={Clock3} href={`${listHref}?view=active`} />
        <StatCard label="Earned this month" value={formatMoney(stats.earnedCents)} hint={`${stats.completed} completed`} icon={Wallet} />
        <StatCard
          label="Rating"
          value={vendor.ratingCount ? vendor.ratingAverage.toFixed(1) : "—"}
          hint={vendor.ratingCount ? `${vendor.ratingCount} reviews` : isGifts ? "Reviews coming soon" : "No reviews yet"}
          icon={Star}
        />
      </div>

      {catalogCount === 0 && (
        <div className="mt-6 flex flex-col gap-4 rounded-xl border border-primary/30 bg-accent p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-accent-foreground">You&apos;re approved. Add your first {isGifts ? "product" : "service"}</p>
            <p className="text-sm text-accent-foreground/80">Customers can&apos;t find you until something is listed.</p>
          </div>
          <Button asChild>
            <Link href="/vendor/catalog">Go to catalog</Link>
          </Button>
        </div>
      )}

      <Section
        className="mt-6"
        title="Your queue"
        action={
          <Link href={listHref} className="text-xs font-medium text-primary hover:underline">
            View all
          </Link>
        }
      >
        {queue.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={CheckCircle2} title="All caught up" description="New orders appear here the moment a customer pays." />
          </div>
        ) : (
          <ul className="divide-y">
            {queue.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.meta}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  )
}
