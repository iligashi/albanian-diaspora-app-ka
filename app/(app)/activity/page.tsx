import type { Metadata } from "next"
import Link from "next/link"
import { Wallet } from "lucide-react"
import { EmptyState, PageHeader } from "@/components/shared/primitives"
import { requireUser } from "@/lib/auth/session"
import { formatMoney } from "@/lib/money"
import { Transaction } from "@/lib/models"
import { cn, formatDateTime } from "@/lib/utils"

export const metadata: Metadata = { title: "Payments" }

const HREF = { bill: "/bills/", gift: "/gifts/orders/", booking: "/services/bookings/" } as const

export default async function ActivityPage() {
  const user = await requireUser("customer")
  const transactions = await Transaction.find({ customer: user.id }).sort({ createdAt: -1 }).limit(200).lean()

  return (
    <>
      <PageHeader title="Payments" description="Every charge and refund on your account." />
      {transactions.length === 0 ? (
        <EmptyState icon={Wallet} title="No payments yet" description="Charges and refunds will be listed here, with a reference for each." />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-5 py-3 font-medium">Reference</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.map((t) => {
                const refund = t.type === "refund"
                const failed = t.status === "failed"
                return (
                  <tr key={t._id.toString()}>
                    <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{formatDateTime(t.createdAt)}</td>
                    <td className="px-5 py-3">
                      {t.description}
                      {failed && <span className="ml-2 text-xs font-medium text-destructive">Failed</span>}
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`${HREF[t.subjectKind]}${t.subjectId}`} className="font-mono text-xs text-primary hover:underline">
                        {t.subjectReference}
                      </Link>
                    </td>
                    <td className={cn("tabular whitespace-nowrap px-5 py-3 text-right font-medium", refund && "text-emerald-700", failed && "text-muted-foreground line-through")}>
                      {refund ? "+" : "−"}
                      {formatMoney(t.amountCents)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
