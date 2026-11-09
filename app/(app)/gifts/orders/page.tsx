import type { Metadata } from "next"
import Link from "next/link"
import { Gift } from "lucide-react"
import { SubNav } from "@/components/shared/filters"
import { GIFT_TABS } from "@/components/shared/nav"
import { EmptyState, PageHeader, StatusBadge } from "@/components/shared/primitives"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/auth/session"
import { formatMoney } from "@/lib/money"
import { GiftOrder, Vendor } from "@/lib/models"
import { formatDate } from "@/lib/utils"

export const metadata: Metadata = { title: "Gift orders" }

export default async function GiftOrdersPage() {
  const user = await requireUser("customer")
  const orders = await GiftOrder.find({ customer: user.id }).sort({ createdAt: -1 }).limit(100).lean()
  const vendors = new Map(
    (await Vendor.find({ _id: { $in: orders.map((o) => o.vendor) } }).select("businessName").lean()).map((v) => [v._id.toString(), v.businessName]),
  )

  return (
    <>
      <PageHeader title="Gifts" description="Follow every gift until it's in their hands." />
      <SubNav
        current="/gifts/orders"
        items={GIFT_TABS}
      />
      {orders.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="No gifts sent yet"
          description="Surprise someone back home with flowers, a cake or a basket of local treats."
          action={
            <Button asChild>
              <Link href="/gifts">Browse gifts</Link>
            </Button>
          }
        />
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {orders.map((o) => (
            <li key={o._id.toString()}>
              <Link href={`/gifts/orders/${o._id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/40">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{o.items.map((i) => `${i.name}${i.quantity > 1 ? ` × ${i.quantity}` : ""}`).join(", ")}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    To {o.recipient.fullName} · {vendors.get(o.vendor.toString())} · delivery {formatDate(o.deliveryDate)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="tabular text-sm font-medium">{formatMoney(o.totalCents)}</span>
                  <StatusBadge status={o.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
