import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CalendarDays, Gift, PackageOpen, PartyPopper, Receipt, Truck, Users, Wallet, Wrench } from "lucide-react"
import { ActivityList } from "@/components/shared/activity-list"
import { EmptyState, PageHeader, Section, StatCard, StatusBadge } from "@/components/shared/primitives"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/auth/session"
import { formatMoney } from "@/lib/money"
import { Recipient } from "@/lib/models"
import { customerActivity, customerOverview } from "@/lib/queries"
import { upcomingOccasions } from "@/lib/domain/occasions"
import { formatDate } from "@/lib/utils"

export const metadata: Metadata = { title: "Overview" }

const QUICK = [
  { href: "/bills/new", label: "Pay a bill", body: "Electricity, water, internet, rent", icon: Receipt },
  { href: "/gifts", label: "Send a gift", body: "Flowers, cakes, baskets", icon: Gift },
  { href: "/services", label: "Book a service", body: "Cleaning, repairs, care", icon: Wrench },
]

export default async function DashboardPage() {
  const user = await requireUser("customer")
  const [family, overview, activity] = await Promise.all([
    Recipient.find({ owner: user.id }).select("fullName birthday").lean(),
    customerOverview(user.id),
    customerActivity(user.id, 6),
  ])
  const familyCount = family.length
  const occasions = upcomingOccasions(
    new Date(),
    family.map((r) => ({ id: r._id.toString(), fullName: r.fullName, birthday: r.birthday })),
    40,
  ).slice(0, 4)

  return (
    <>
      <PageHeader title={`Mirë se vini, ${user.firstName}`} description="Here's what's happening with your family's orders." />

      {familyCount === 0 && (
        <div className="mb-6 flex flex-col gap-4 rounded-xl border border-primary/30 bg-accent p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-accent-foreground">Start by adding a family member</p>
            <p className="text-sm text-accent-foreground/80">Bills, gifts and bookings are all sent to someone you&apos;ve saved.</p>
          </div>
          <Button asChild>
            <Link href="/family">Add family member</Link>
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Family members" value={familyCount} icon={Users} href="/family" />
        <StatCard label="Orders in progress" value={overview.openOrders} hint="Bills, gifts and bookings" icon={PackageOpen} />
        <StatCard label="Spent this month" value={formatMoney(overview.spentThisMonthCents)} hint="After refunds" icon={Wallet} href="/activity" />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {QUICK.map((q) => (
          <Link
            key={q.href}
            href={q.href}
            className="group flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
          >
            <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
              <q.icon className="size-5" />
            </span>
            <div className="flex-1">
              <p className="font-medium">{q.label}</p>
              <p className="text-xs text-muted-foreground">{q.body}</p>
            </div>
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>

      {occasions.length > 0 && (
        <section className="mt-6 rounded-xl border bg-card">
          <header className="flex items-center justify-between gap-4 border-b px-5 py-3.5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <PartyPopper className="size-4 text-primary" /> Coming up
            </h2>
            <span className="text-xs text-muted-foreground">Order 3 days ahead so it arrives on the day</span>
          </header>
          <ul className="grid divide-y sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
            {occasions.map((o) => (
              <li key={o.key} className="flex flex-col gap-2 p-4 sm:border-r last:border-r-0">
                <span className={`w-fit rounded-full px-2 py-0.5 text-xs font-medium ${o.inDays <= 7 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {o.inDays === 0 ? "Today" : o.inDays === 1 ? "Tomorrow" : `In ${o.inDays} days`}
                </span>
                <span className="text-sm font-semibold leading-tight">{o.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(o.date)}
                  {o.approximate ? " (approx.)" : ""}
                </span>
                <Link
                  href={`/gifts?category=${o.suggest}${o.recipient ? `&for=${o.recipient.id}` : ""}`}
                  className="mt-auto text-xs font-medium text-primary hover:underline"
                >
                  {o.recipient ? `Send ${o.recipient.fullName.split(" ")[0]} a gift →` : "Send something home →"}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Section
          title="Recent activity"
          action={
            <Link href="/activity" className="text-xs font-medium text-primary hover:underline">
              All payments
            </Link>
          }
        >
          {activity.length ? (
            <ActivityList items={activity} />
          ) : (
            <div className="p-5">
              <EmptyState icon={PackageOpen} title="Nothing yet" description="Your bills, gifts and bookings will show up here." />
            </div>
          )}
        </Section>

        <div className="space-y-6">
          <Section title="Upcoming visits">
            {overview.upcomingBookings.length ? (
              <ul className="divide-y">
                {overview.upcomingBookings.map((b) => (
                  <li key={b._id.toString()}>
                    <Link href={`/services/bookings/${b._id}`} className="flex items-start gap-3 px-5 py-3 hover:bg-muted/50">
                      <CalendarDays className="mt-0.5 size-4 text-muted-foreground" />
                      <div className="min-w-0 flex-1 text-sm">
                        <p className="truncate font-medium">{b.offeringTitle}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(b.date)} · {b.timeSlot} · {b.recipient.city}
                        </p>
                      </div>
                      <StatusBadge status={b.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-4 text-sm text-muted-foreground">No visits scheduled.</p>
            )}
          </Section>
          <Section title="Gifts on the way">
            {overview.upcomingDeliveries.length ? (
              <ul className="divide-y">
                {overview.upcomingDeliveries.map((g) => (
                  <li key={g._id.toString()}>
                    <Link href={`/gifts/orders/${g._id}`} className="flex items-start gap-3 px-5 py-3 hover:bg-muted/50">
                      <Truck className="mt-0.5 size-4 text-muted-foreground" />
                      <div className="min-w-0 flex-1 text-sm">
                        <p className="truncate font-medium">{g.items[0]?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          To {g.recipient.fullName} · {formatDate(g.deliveryDate)}
                        </p>
                      </div>
                      <StatusBadge status={g.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-4 text-sm text-muted-foreground">No gifts in transit.</p>
            )}
          </Section>
        </div>
      </div>
    </>
  )
}
