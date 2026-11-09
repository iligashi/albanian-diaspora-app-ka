import type { Metadata } from "next"
import Link from "next/link"
import { Clock, Wrench } from "lucide-react"
import { FilterChips, SubNav } from "@/components/shared/filters"
import { SERVICE_TABS } from "@/components/shared/nav"
import { EmptyState, PageHeader } from "@/components/shared/primitives"
import { Rating } from "@/components/shared/rating"
import { requireUser } from "@/lib/auth/session"
import { browseOfferings } from "@/lib/catalog-queries"
import { SERVICE_CATEGORIES, type ServiceCategory } from "@/lib/domain/catalog"
import { formatMoney } from "@/lib/money"
import { Recipient } from "@/lib/models"
import { humanize } from "@/lib/utils"

export const metadata: Metadata = { title: "Home services" }

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ category?: string; city?: string }> }) {
  const user = await requireUser("customer")
  const sp = await searchParams
  const category = SERVICE_CATEGORIES.includes(sp.category as ServiceCategory) ? (sp.category as ServiceCategory) : undefined
  const familyCities = [...new Set((await Recipient.find({ owner: user.id }).select("city").lean()).map((r) => r.city))]
  const city = sp.city && familyCities.includes(sp.city as (typeof familyCities)[number]) ? sp.city : undefined
  const offerings = await browseOfferings({ category, city })

  return (
    <>
      <PageHeader title="Home services" description="Vetted local providers. If a provider declines or you cancel before the job starts, you're refunded in full." />
      <SubNav current="/services" items={SERVICE_TABS} />
      <div className="mb-6 space-y-2">
        {familyCities.length > 0 && (
          <FilterChips label="Works in" param="city" current={city} basePath="/services" baseParams={{ category }} options={familyCities.map((c) => ({ value: c, label: c }))} />
        )}
        <FilterChips
          label="Category"
          param="category"
          current={category}
          basePath="/services"
          baseParams={{ city }}
          options={SERVICE_CATEGORIES.map((c) => ({ value: c, label: humanize(c) }))}
        />
      </div>

      {offerings.length === 0 ? (
        <EmptyState icon={Wrench} title="No providers match" description="Try another category or town. We're adding providers across Kosovo." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {offerings.map((o) => (
            <Link key={o.id} href={`/services/${o.id}`} className="flex flex-col rounded-xl border bg-card p-5 transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-primary">{humanize(o.category)}</p>
                  <h2 className="mt-1 font-semibold">{o.title}</h2>
                </div>
                <span className="tabular whitespace-nowrap font-semibold">{formatMoney(o.priceCents)}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{o.description}</p>
              <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-4 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{o.vendor.businessName}</span>
                <Rating average={o.vendor.ratingAverage} count={o.vendor.ratingCount} />
                {o.durationMinutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" /> ~{Math.round(o.durationMinutes / 60) || 1}h
                  </span>
                )}
                <span>{o.vendor.serviceCities.slice(0, 3).join(", ")}{o.vendor.serviceCities.length > 3 ? "…" : ""}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
