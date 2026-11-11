import type { Metadata } from "next"
import Link from "next/link"
import { Gift, Receipt, Wrench } from "lucide-react"
import { PageHeader, Section, StatCard } from "@/components/shared/primitives"
import { requireUser } from "@/lib/auth/session"
import { connectDB } from "@/lib/db"
import { formatMoney } from "@/lib/money"
import { yearlyReport } from "@/lib/report"
import { cn } from "@/lib/utils"
import { PrintButton } from "./print-button"

export const metadata: Metadata = { title: "Yearly report" }

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const user = await requireUser("customer")
  await connectDB()
  const current = new Date().getFullYear()
  const requested = Number((await searchParams).year)
  const year = Number.isInteger(requested) && requested >= 2020 && requested <= current ? requested : current
  const r = await yearlyReport(user.id, year)
  const peak = Math.max(1, ...r.months.map((m) => m.cents))

  return (
    <>
      <PageHeader
        title={`Your ${year} for the family`}
        back={{ href: "/activity", label: "Payments" }}
        description="Everything you sent home this year, after refunds. Share it with your siblings or keep it for your records."
        actions={
          <div className="flex items-center gap-2 print:hidden">
            {[current - 1, current].map((y) => (
              <Link
                key={y}
                href={`/activity/report?year=${y}`}
                className={cn("rounded-md px-3 py-1.5 text-sm", y === year ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
              >
                {y}
              </Link>
            ))}
            <PrintButton />
          </div>
        }
      />

      <div className="rounded-xl bg-ink p-6 text-ink-foreground">
        <p className="text-sm opacity-70">Sent home in {year}</p>
        <p className="tabular mt-1 text-4xl font-semibold">{formatMoney(r.totalCents)}</p>
        <p className="mt-2 text-sm opacity-70">
          {r.orders} {r.orders === 1 ? "order" : "orders"} for {r.people.length} {r.people.length === 1 ? "person" : "people"}
          {r.walletTopUpsCents > 0 ? ` · ${formatMoney(r.walletTopUpsCents)} added to family wallets` : ""}
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Bills" value={formatMoney(r.byKind.bill)} icon={Receipt} />
        <StatCard label="Gifts" value={formatMoney(r.byKind.gift)} icon={Gift} />
        <StatCard label="Home services" value={formatMoney(r.byKind.booking)} icon={Wrench} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Section title="Month by month">
          <div className="flex h-56 items-end gap-1.5 px-5 pb-3 pt-6" role="img" aria-label="Spending per month">
            {r.months.map((m) => (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className={cn("w-full rounded-t-md", m.cents > 0 ? "bg-primary" : "bg-muted")}
                    style={{ height: `${Math.max(2, (m.cents / peak) * 100)}%` }}
                    title={`${MONTHS[m.month - 1]}: ${formatMoney(m.cents)}`}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{MONTHS[m.month - 1]}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="By family member">
          {r.people.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">Nothing sent yet in {year}.</p>
          ) : (
            <ul className="divide-y">
              {r.people.map((p) => (
                <li key={p.name} className="px-5 py-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="font-medium">{p.name}</span>
                    <span className="tabular font-semibold">{formatMoney(p.cents)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(p.cents / Math.max(1, r.people[0].cents)) * 100}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.orders} {p.orders === 1 ? "order" : "orders"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </>
  )
}
