import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Package } from "lucide-react"
import { SubNav } from "@/components/shared/filters"
import { EmptyState, PageHeader, StatusBadge } from "@/components/shared/primitives"
import { requireUser } from "@/lib/auth/session"
import { formatMoney } from "@/lib/money"
import { GiftOrder } from "@/lib/models"
import { getVendorForUser } from "@/lib/services/vendor"
import { formatDate } from "@/lib/utils"
import { VENDOR_GIFT_QUEUE } from "@/lib/vendor-queries"

export const metadata: Metadata = { title: "Gift orders" }

type View = keyof typeof VENDOR_GIFT_QUEUE

export default async function VendorOrdersPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const user = await requireUser("vendor")
  const vendor = await getVendorForUser(user.id)
  if (!vendor || vendor.kind !== "gifts") redirect("/vendor")
  const { view: rawView } = await searchParams
  const view: View = rawView === "active" || rawView === "done" ? rawView : "action"
  const orders = await GiftOrder.find({ vendor: vendor._id, status: { $in: VENDOR_GIFT_QUEUE[view] } })
    .sort(view === "done" ? { updatedAt: -1 } : { deliveryDate: 1 })
    .limit(100)
    .lean()

  return (
    <>
      <PageHeader title="Gift orders" description="Accept new orders quickly. Customers can cancel until you do." />
      <SubNav
        current={`/vendor/orders?view=${view}`}
        items={[
          { href: "/vendor/orders?view=action", label: "New" },
          { href: "/vendor/orders?view=active", label: "In progress" },
          { href: "/vendor/orders?view=done", label: "Finished" },
        ]}
      />
      {orders.length === 0 ? (
        <EmptyState icon={Package} title="Nothing here" description={view === "action" ? "No new orders right now. We'll notify you when one comes in." : "No orders in this list."} />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Deliver to</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Your payout</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((o) => (
                <tr key={o._id.toString()} className="hover:bg-muted/40">
                  <td className="px-5 py-3">
                    <Link href={`/vendor/orders/${o._id}`} className="font-medium hover:underline">
                      {o.items.map((i) => `${i.name} × ${i.quantity}`).join(", ")}
                    </Link>
                    <p className="font-mono text-xs text-muted-foreground">{o.reference}</p>
                  </td>
                  <td className="px-5 py-3">{o.recipient.city}</td>
                  <td className="px-5 py-3">{formatDate(o.deliveryDate)}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="tabular px-5 py-3 text-right font-medium">{formatMoney(o.subtotalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
