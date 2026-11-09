import type { Metadata } from "next"
import { Store } from "lucide-react"
import { SubNav } from "@/components/shared/filters"
import { EmptyState, PageHeader, StatusBadge } from "@/components/shared/primitives"
import { Rating } from "@/components/shared/rating"
import { requireUser } from "@/lib/auth/session"
import { User, Vendor } from "@/lib/models"
import { formatDate, humanize } from "@/lib/utils"
import { VendorStatusButtons } from "./vendor-status-buttons"

export const metadata: Metadata = { title: "Vendors" }

const VIEWS = ["pending", "approved", "suspended"] as const

export default async function AdminVendorsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  await requireUser("admin")
  const { view: raw } = await searchParams
  const view = VIEWS.includes(raw as (typeof VIEWS)[number]) ? (raw as (typeof VIEWS)[number]) : "pending"
  const vendors = await Vendor.find({ status: view }).sort({ createdAt: view === "pending" ? 1 : -1 }).lean()
  const owners = new Map((await User.find({ _id: { $in: vendors.map((v) => v.user) } }).select("firstName lastName email").lean()).map((u) => [u._id.toString(), u]))

  return (
    <>
      <PageHeader title="Vendors" description="Approve businesses before families can order from them." />
      <SubNav current={`/admin/vendors?view=${view}`} items={VIEWS.map((v) => ({ href: `/admin/vendors?view=${v}`, label: humanize(v) }))} />
      {vendors.length === 0 ? (
        <EmptyState icon={Store} title="No vendors here" description={view === "pending" ? "No applications waiting for review." : "Nothing in this list."} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {vendors.map((v) => {
            const owner = owners.get(v.user.toString())
            return (
              <article key={v._id.toString()} className="flex flex-col rounded-xl border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{v.businessName}</h2>
                    <p className="text-xs text-muted-foreground">
                      {v.kind === "gifts" ? "Gift shop" : "Home services"} · {v.city} · applied {formatDate(v.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={v.status} />
                </div>
                {v.description && <p className="mt-3 text-sm text-muted-foreground">{v.description}</p>}
                <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                  <dt className="text-muted-foreground">Owner</dt>
                  <dd>
                    {owner ? `${owner.firstName} ${owner.lastName} · ${owner.email}` : "—"}
                  </dd>
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd>{v.phone}</dd>
                  <dt className="text-muted-foreground">Covers</dt>
                  <dd>{v.serviceCities.join(", ")}</dd>
                  {v.status === "approved" && (
                    <>
                      <dt className="text-muted-foreground">Rating</dt>
                      <dd>
                        <Rating average={v.ratingAverage} count={v.ratingCount} />
                      </dd>
                    </>
                  )}
                </dl>
                <div className="mt-auto pt-4">
                  <VendorStatusButtons vendorId={v._id.toString()} status={v.status} />
                </div>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}
