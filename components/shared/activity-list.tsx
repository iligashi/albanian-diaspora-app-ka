import Link from "next/link"
import { Gift, Receipt, Wrench } from "lucide-react"
import { formatMoney } from "@/lib/money"
import type { ActivityItem } from "@/lib/queries"
import { formatDate } from "@/lib/utils"
import { StatusBadge } from "./primitives"

const ICON = { bill: Receipt, gift: Gift, booking: Wrench }

export function ActivityList({ items }: { items: ActivityItem[] }) {
  return (
    <ul className="divide-y">
      {items.map((item) => {
        const Icon = ICON[item.kind]
        return (
          <li key={`${item.kind}-${item.id}`}>
            <Link href={item.href} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/50">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary">
                <Icon className="size-4 text-muted-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.subtitle} · {item.reference} · {formatDate(item.date)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="tabular text-sm font-medium">{formatMoney(item.totalCents)}</span>
                <StatusBadge status={item.status} />
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
