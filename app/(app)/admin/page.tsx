import type { Metadata } from "next"
import Link from "next/link"
import { startOfMonth } from "date-fns"
import { CalendarDays, Gift, Receipt, Store, Users, Wallet } from "lucide-react"
import { RunPlansButton } from "./run-plans-button"
import { PageHeader, Section, StatCard } from "@/components/shared/primitives"
import { requireUser } from "@/lib/auth/session"
import { formatMoney } from "@/lib/money"
import { Bill, Booking, GiftOrder, Transaction, User, Vendor } from "@/lib/models"
import { OPEN_BOOKING, OPEN_GIFT } from "@/lib/queries"

export const metadata: Metadata = { title: "Operations" }

export default async function AdminHome() {
  await requireUser("admin")
  const monthStart = startOfMonth(new Date())
  const [billsToSettle, pendingVendors, customers, openGifts, openBookings, volume, fees, signups] = await Promise.all([
    Bill.countDocuments({ status: "paid" }),
    Vendor.countDocuments({ status: "pending" }),
    User.countDocuments({ role: "customer" }),
    GiftOrder.countDocuments({ status: { $in: OPEN_GIFT } }),
    Booking.countDocuments({ status: { $in: OPEN_BOOKING } }),
    Transaction.aggregate<{ _id: string; total: number }>([
      { $match: { status: "succeeded", createdAt: { $gte: monthStart } } },
      { $group: { _id: "$type", total: { $sum: "$amountCents" } } },
    ]),
    // Platform revenue = service fees on orders that weren't refunded.
    Promise.all([
      Bill.aggregate([{ $match: { status: { $in: ["paid", "settled"] }, createdAt: { $gte: monthStart } } }, { $group: { _id: null, t: { $sum: "$feeCents" } } }]),
      GiftOrder.aggregate([
        { $match: { status: { $in: ["placed", "accepted", "out_for_delivery", "delivered"] }, createdAt: { $gte: monthStart } } },
        { $group: { _id: null, t: { $sum: "$feeCents" } } },
      ]),
      Booking.aggregate([
        { $match: { status: { $in: ["requested", "confirmed", "in_progress", "completed"] }, createdAt: { $gte: monthStart } } },
        { $group: { _id: null, t: { $sum: "$feeCents" } } },
      ]),
    ]).then((parts) => parts.reduce((sum, p) => sum + (p[0]?.t ?? 0), 0)),
    User.countDocuments({ role: "customer", createdAt: { $gte: monthStart } }),
  ])
  const charged = volume.find((v) => v._id === "charge")?.total ?? 0
  const refunded = volume.find((v) => v._id === "refund")?.total ?? 0

  return (
    <>
      <PageHeader
        title="Operations"
        description="Everything that needs a person, plus how the month is going."
        actions={<RunPlansButton />}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/admin/bills" className="flex items-center justify-between rounded-xl border bg-card p-5 hover:border-primary/40">
          <div>
            <p className="text-sm text-muted-foreground">Bills waiting to be paid to providers</p>
            <p className="tabular mt-1 text-3xl font-semibold">{billsToSettle}</p>
          </div>
          <Receipt className="size-8 text-primary" />
        </Link>
        <Link href="/admin/vendors" className="flex items-center justify-between rounded-xl border bg-card p-5 hover:border-primary/40">
          <div>
            <p className="text-sm text-muted-foreground">Vendor applications to review</p>
            <p className="tabular mt-1 text-3xl font-semibold">{pendingVendors}</p>
          </div>
          <Store className="size-8 text-primary" />
        </Link>
      </div>

      <Section title="This month" className="mt-6">
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Payment volume" value={formatMoney(charged - refunded)} hint={`${formatMoney(refunded)} refunded`} icon={Wallet} />
          <StatCard label="Service fee revenue" value={formatMoney(fees)} hint="Excludes refunded orders" icon={Wallet} />
          <StatCard label="Customers" value={customers} hint={`${signups} new this month`} icon={Users} href="/admin/users" />
          <StatCard label="Gift orders open" value={openGifts} icon={Gift} />
          <StatCard label="Bookings open" value={openBookings} icon={CalendarDays} />
        </div>
      </Section>
    </>
  )
}
