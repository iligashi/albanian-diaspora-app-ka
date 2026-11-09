import Link from "next/link"
import { cn } from "@/lib/utils"

/** Link-based filter chips: work without JS and keep filters in the URL (shareable, back-button friendly). */
export function FilterChips({
  label,
  param,
  options,
  current,
  baseParams,
  basePath,
}: {
  label: string
  param: string
  options: Array<{ value: string; label: string }>
  current?: string
  baseParams: Record<string, string | undefined>
  basePath: string
}) {
  const href = (value?: string) => {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries({ ...baseParams, [param]: value })) if (v) params.set(k, v)
    const qs = params.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }
  const chip = (active: boolean) =>
    cn(
      "whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition-colors",
      active ? "border-foreground bg-foreground text-background" : "bg-card hover:border-foreground/40",
    )
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <Link href={href(undefined)} className={chip(!current)}>
        All
      </Link>
      {options.map((o) => (
        <Link key={o.value} href={href(o.value)} className={chip(current === o.value)}>
          {o.label}
        </Link>
      ))}
    </div>
  )
}

export function SubNav({ items, current }: { items: Array<{ href: string; label: string }>; current: string }) {
  return (
    <nav className="mb-6 flex gap-1 border-b">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className={cn(
            "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
            current === i.href ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  )
}
