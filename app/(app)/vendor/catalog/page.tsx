import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Store } from "lucide-react"
import { EmptyState, PageHeader } from "@/components/shared/primitives"
import { requireUser } from "@/lib/auth/session"
import { formatMoney } from "@/lib/money"
import { Offering, Product } from "@/lib/models"
import { getVendorForUser } from "@/lib/services/vendor"
import { cn, humanize } from "@/lib/utils"
import { CatalogItemDialog, type CatalogItem } from "./catalog-item-dialog"

export const metadata: Metadata = { title: "Catalog" }

export default async function CatalogPage() {
  const user = await requireUser("vendor")
  const vendor = await getVendorForUser(user.id)
  if (!vendor) redirect("/vendor/profile")
  const kind = vendor.kind
  const canEdit = vendor.status === "approved"

  const items: CatalogItem[] =
    kind === "gifts"
      ? (await Product.find({ vendor: vendor._id }).sort({ createdAt: -1 }).lean()).map((p) => ({
          id: p._id.toString(),
          title: p.name,
          category: p.category,
          price: (p.priceCents / 100).toFixed(2),
          description: p.description ?? "",
          active: p.active,
          durationMinutes: "",
        }))
      : (await Offering.find({ vendor: vendor._id }).sort({ createdAt: -1 }).lean()).map((o) => ({
          id: o._id.toString(),
          title: o.title,
          category: o.category,
          price: (o.priceCents / 100).toFixed(2),
          description: o.description ?? "",
          active: o.active,
          durationMinutes: o.durationMinutes ? String(o.durationMinutes) : "",
        }))
  const noun = kind === "gifts" ? "product" : "service"

  return (
    <>
      <PageHeader
        title="Catalog"
        description={canEdit ? `The ${noun}s customers can order from you. Hidden ${noun}s aren't shown in search.` : "You can add listings once your business is approved."}
        actions={canEdit && items.length > 0 && <CatalogItemDialog kind={kind} />}
      />
      {items.length === 0 ? (
        <EmptyState
          icon={Store}
          title={`No ${noun}s yet`}
          description={kind === "gifts" ? "List bouquets, cakes or baskets with a clear name and price." : "List what you do with a clear title and a starting price."}
          action={canEdit && <CatalogItemDialog kind={kind} />}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">{kind === "gifts" ? "Product" : "Service"}</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Visibility</th>
                <th className="px-5 py-3 text-right font-medium">Price</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => (
                <tr key={item.id} className={cn(!item.active && "text-muted-foreground")}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="line-clamp-1 max-w-sm text-xs text-muted-foreground">{item.description}</p>
                  </td>
                  <td className="px-5 py-3">{humanize(item.category)}</td>
                  <td className="px-5 py-3">
                    <span className={cn("text-xs font-medium", item.active ? "text-emerald-700" : "text-muted-foreground")}>{item.active ? "Listed" : "Hidden"}</span>
                  </td>
                  <td className="tabular px-5 py-3 text-right font-medium">{formatMoney(Math.round(Number(item.price) * 100))}</td>
                  <td className="px-5 py-3 text-right">{canEdit && <CatalogItemDialog kind={kind} item={item} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
