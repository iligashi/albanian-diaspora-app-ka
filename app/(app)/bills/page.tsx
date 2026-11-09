import type { Metadata } from "next"
import Link from "next/link"
import { Plus, Receipt } from "lucide-react"
import { EmptyState, PageHeader, StatusBadge } from "@/components/shared/primitives"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/auth/session"
import { getBillProvider } from "@/lib/domain/catalog"
import { formatMoney } from "@/lib/money"
import { Bill } from "@/lib/models"
import { formatDate } from "@/lib/utils"

export const metadata: Metadata = { title: "Bills" }

export default async function BillsPage() {
  const user = await requireUser("customer")
  const bills = await Bill.find({ customer: user.id }).sort({ createdAt: -1 }).limit(100).lean()

  return (
    <>
      <PageHeader
        title="Bills"
        description="We pay the provider on your behalf and add their receipt number once it's done."
        actions={
          <Button asChild>
            <Link href="/bills/new">
              <Plus /> Pay a bill
            </Link>
          </Button>
        }
      />
      {bills.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No bills paid yet"
          description="Pay electricity, water, internet, mobile top-ups or rent for your family."
          action={
            <Button asChild>
              <Link href="/bills/new">Pay a bill</Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Provider</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">For</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">Date</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {bills.map((b) => (
                <tr key={b._id.toString()} className="hover:bg-muted/40">
                  <td className="px-5 py-3">
                    <Link href={`/bills/${b._id}`} className="font-medium hover:underline">
                      {getBillProvider(b.provider)?.name ?? b.provider}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {b.reference}
                      {b.period ? ` · ${b.period}` : ""}
                    </p>
                  </td>
                  <td className="hidden px-5 py-3 md:table-cell">{b.recipient.fullName}</td>
                  <td className="hidden px-5 py-3 text-muted-foreground sm:table-cell">{formatDate(b.createdAt)}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="tabular px-5 py-3 text-right font-medium">{formatMoney(b.totalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
