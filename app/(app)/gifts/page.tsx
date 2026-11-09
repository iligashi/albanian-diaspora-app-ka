import type { Metadata } from "next"
import Link from "next/link"
import { Cake, Flower2, Gift, Home, Package, ShoppingBasket, Candy } from "lucide-react"
import { FilterChips, SubNav } from "@/components/shared/filters"
import { GIFT_TABS } from "@/components/shared/nav"
import { EmptyState, PageHeader } from "@/components/shared/primitives"
import { Rating } from "@/components/shared/rating"
import { requireUser } from "@/lib/auth/session"
import { browseProducts } from "@/lib/catalog-queries"
import { GIFT_CATEGORIES, type GiftCategory } from "@/lib/domain/catalog"
import { formatMoney } from "@/lib/money"
import { Recipient } from "@/lib/models"
import { humanize } from "@/lib/utils"

export const metadata: Metadata = { title: "Gifts" }

const CATEGORY_ICON = { flowers: Flower2, cakes: Cake, food_baskets: ShoppingBasket, sweets: Candy, household: Home, other: Package }

export default async function GiftsPage({ searchParams }: { searchParams: Promise<{ category?: string; city?: string }> }) {
  const user = await requireUser("customer")
  const sp = await searchParams
  const category = GIFT_CATEGORIES.includes(sp.category as GiftCategory) ? (sp.category as GiftCategory) : undefined
  const familyCities = [...new Set((await Recipient.find({ owner: user.id }).select("city").lean()).map((r) => r.city))]
  const city = sp.city && familyCities.includes(sp.city as (typeof familyCities)[number]) ? sp.city : undefined
  const products = await browseProducts({ category, city })

  return (
    <>
      <PageHeader title="Gifts" description="From local shops that deliver to your family's town." />
      <SubNav
        current="/gifts"
        items={GIFT_TABS}
      />
      <div className="mb-6 space-y-2">
        {familyCities.length > 0 && (
          <FilterChips
            label="Delivers to"
            param="city"
            current={city}
            basePath="/gifts"
            baseParams={{ category }}
            options={familyCities.map((c) => ({ value: c, label: c }))}
          />
        )}
        <FilterChips
          label="Category"
          param="category"
          current={category}
          basePath="/gifts"
          baseParams={{ city }}
          options={GIFT_CATEGORIES.map((c) => ({ value: c, label: humanize(c) }))}
        />
      </div>

      {products.length === 0 ? (
        <EmptyState icon={Gift} title="No gifts match" description="Try another category or town. New shops join every week." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const Icon = CATEGORY_ICON[p.category]
            return (
              <Link key={p.id} href={`/gifts/${p.id}`} className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
                <div className="grid aspect-[16/9] place-items-center bg-gradient-to-br from-accent to-secondary">
                  <Icon className="size-10 text-primary/70 transition-transform group-hover:scale-110" />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-semibold">{p.name}</h2>
                    <span className="tabular font-semibold">{formatMoney(p.priceCents)}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                  <div className="mt-auto flex items-center justify-between pt-4 text-xs text-muted-foreground">
                    <span>
                      {p.vendor.businessName} · {p.vendor.city}
                    </span>
                    <Rating average={p.vendor.ratingAverage} count={p.vendor.ratingCount} />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
