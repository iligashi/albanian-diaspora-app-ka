import type { Metadata } from "next"
import { CheckCircle2 } from "lucide-react"
import { SubNav } from "@/components/shared/filters"
import { EmptyState, PageHeader, StatusBadge } from "@/components/shared/primitives"
import { requireUser } from "@/lib/auth/session"
import { getBillProvider } from "@/lib/domain/catalog"
import { formatMoney } from "@/lib/money"
import { Bill, User } from "@/lib/models"
import { formatDateTime } from "@/lib/utils"
import { BillQueueActions } from "./bill-queue-actions"

export const metadata: Metadata = { title: "Bill queue" }

export default async function AdminBillsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  await requireUser("admin")
  const { view } = await searchParams
  const history = view === "history"
  const bills = await Bill.find(history ? { status: { $in: ["settled", "refunded", "payment_failed"] } } : { status: "paid" })
    .sort(history ? { updatedAt: -1 } : { createdAt: 1 })
    .limit(100)
    .lean()
  const customers = new Map(
    (await User.find({ _id: { $in: bills.map((b) => b.customer) } }).select("firstName lastName email").lean()).map((u) => [
      u._id.toString(),
      `${u.firstName} ${u.lastName}`,
    ]),
  )

  return (
    <>
      <PageHeader title="Bill queue" description="Pay each provider, then record their receipt number. Oldest first." />
      <SubNav
        current={history ? "/admin/bills?view=history" : "/admin/bills"}
        items={[
          { href: "/admin/bills", label: "To settle" },
          { href: "/admin/bills?view=history", label: "History" },
        ]}
      />
      {bills.length === 0 ? (
        <EmptyState icon={CheckCircle2} title={history ? "No history yet" : "Queue is empty"} description={history ? "Settled and refunded bills appear here." : "Every paid bill has been settled."} />
      ) : (
        <div className="space-y-3">
          {bills.map((b) => {
            const provider = getBillProvider(b.provider)
            return (
              <article key={b._id.toString()} className="flex flex-col gap-4 rounded-xl border bg-card p-5 lg:flex-row lg:items-center">
                <div className="grid flex-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-[1.2fr_1fr_auto]">
                  <div>
                    <p className="font-semibold">{provider?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {b.reference} · paid {formatDateTime(b.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p>
                      {provider?.accountLabel}: <span className="font-mono">{b.accountNumber}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {b.recipient.fullName}, {b.recipient.city}
                      {b.period ? ` · ${b.period}` : ""} · by {customers.get(b.customer.toString())}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="tabular font-semibold">{formatMoney(b.amountCents)}</p>
                    <p className="text-xs text-muted-foreground">to provider</p>
                  </div>
                </div>
                {history ? (
                  <div className="flex items-center gap-3">
                    {b.settlementReference && <span className="font-mono text-xs text-muted-foreground">{b.settlementReference}</span>}
                    <StatusBadge status={b.status} />
                  </div>
                ) : (
                  <BillQueueActions billId={b._id.toString()} />
                )}
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}
