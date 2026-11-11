import type { Metadata } from "next"
import { CalendarClock, Gift, Receipt, Repeat, Wrench } from "lucide-react"
import { EmptyState, PageHeader, StatusBadge } from "@/components/shared/primitives"
import { requireUser } from "@/lib/auth/session"
import { connectDB } from "@/lib/db"
import { Recipient, Wallet } from "@/lib/models"
import { formatMoney } from "@/lib/money"
import { plansFor } from "@/lib/services/plans"
import { formatDate } from "@/lib/utils"
import { PlanControls } from "./plan-controls"

export const metadata: Metadata = { title: "Recurring plans" }

const KIND_ICON = { bill: Receipt, gift: Gift, booking: Wrench } as const
const INTERVAL_LABEL = { weekly: "Every week", biweekly: "Every 2 weeks", monthly: "Every month", yearly: "Every year" } as const

export default async function PlansPage() {
  const user = await requireUser("customer")
  await connectDB()
  const plans = await plansFor(user.id)
  const walletIds = plans.map((p) => p.payWith).filter((p) => p !== "card")
  const [wallets, recipients] = await Promise.all([
    Wallet.find({ _id: { $in: walletIds } }).select("name").lean(),
    Recipient.find({ owner: user.id }).select("_id").lean(),
  ])
  const walletName = (id: string) => (id === "card" ? "Card" : (wallets.find((w) => w._id.toString() === id)?.name ?? "Wallet"))

  return (
    <>
      <PageHeader
        title="Recurring plans"
        description="Set it once and we take care of it: monthly bills, regular cleaning, flowers on every birthday."
      />
      {plans.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No recurring plans yet"
          description={
            recipients.length === 0
              ? "Add a family member, then choose “Repeat” when you pay a bill, send a gift or book a service."
              : "Choose “Repeat” when you pay a bill, send a gift or book a service, and it will happen automatically."
          }
        />
      ) : (
        <ul className="space-y-3">
          {plans.map((p) => {
            const Icon = KIND_ICON[p.kind]
            const amount = p.kind === "bill" && p.bill?.amountCents ? ` · ${formatMoney(p.bill.amountCents)}` : ""
            return (
              <li key={p._id.toString()} className="rounded-xl border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold">{p.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {INTERVAL_LABEL[p.interval]}
                        {amount} · paid with {walletName(p.payWith)}
                      </p>
                      <p className="mt-2 flex items-center gap-1.5 text-sm">
                        <CalendarClock className="size-4 text-muted-foreground" />
                        {p.status === "active" ? <>Next: {formatDate(p.nextOccurrence)}</> : <span className="text-muted-foreground">Paused</span>}
                      </p>
                      {p.lastResult && (
                        <p className={`mt-1 text-xs ${p.consecutiveFailures > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                          Last run: {p.lastResult}
                          {p.lastRunAt ? ` (${formatDate(p.lastRunAt)})` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <StatusBadge status={p.status === "active" ? "active" : "paused"} />
                    <PlanControls planId={p._id.toString()} status={p.status as "active" | "paused"} />
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <p className="mt-6 text-xs text-muted-foreground">
        Orders are placed automatically ahead of time: bills on the day, gifts 3 days before delivery, services 4 days before the visit. A plan pauses itself after 3 failed attempts and we&apos;ll tell you why.
      </p>
    </>
  )
}
