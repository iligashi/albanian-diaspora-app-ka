import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { FlaskConical } from "lucide-react"
import { statusTone, type StatusTone } from "@/lib/domain/workflow"
import { cn, formatDateTime, humanize } from "@/lib/utils"

export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2 font-semibold", className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
          <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.1 5.3 3 1.7-1.9 3.2-3 5.3-3 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21Z" />
        </svg>
      </span>
      <span className={cn("text-[15px] tracking-tight", inverted ? "text-ink-foreground" : "text-foreground")}>
        Diaspora<span className="text-primary">Connect</span>
      </span>
    </Link>
  )
}

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
  back?: { href: string; label: string }
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-2 inline-block text-sm text-muted-foreground hover:text-foreground">
            ← {back.label}
          </Link>
        )}
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: "bg-muted text-muted-foreground ring-border",
  info: "bg-sky-50 text-sky-800 ring-sky-200",
  success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  warning: "bg-amber-50 text-amber-800 ring-amber-200",
  danger: "bg-red-50 text-red-800 ring-red-200",
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONE_CLASSES[statusTone(status)],
        className,
      )}
    >
      {humanize(status)}
    </span>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed bg-card px-6 py-12 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-accent text-accent-foreground">
        <Icon className="size-5" />
      </span>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
}: {
  label: string
  value: React.ReactNode
  hint?: string
  icon: LucideIcon
  href?: string
}) {
  const body = (
    <div className="flex h-full items-start justify-between gap-3 rounded-xl border bg-card p-5 transition-colors hover:border-foreground/20">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="tabular mt-1 text-2xl font-semibold">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <span className="grid size-9 place-items-center rounded-lg bg-secondary text-secondary-foreground">
        <Icon className="size-4" />
      </span>
    </div>
  )
  return href ? <Link href={href}>{body}</Link> : body
}

export function Section({ title, action, children, className }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border bg-card", className)}>
      <header className="flex items-center justify-between gap-4 border-b px-5 py-3.5">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </header>
      <div>{children}</div>
    </section>
  )
}

export function DetailList({ items }: { items: Array<[string, React.ReactNode]> }) {
  return (
    <dl className="divide-y">
      {items.map(([label, value]) => (
        <div key={label} className="grid grid-cols-3 gap-4 px-5 py-3 text-sm">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="col-span-2 break-words">{value || "—"}</dd>
        </div>
      ))}
    </dl>
  )
}

export function Timeline({ events }: { events: Array<{ status: string; actor: string; note?: string | null; at: Date | string }> }) {
  const sorted = [...events].reverse()
  return (
    <ol className="space-y-4 px-5 py-4">
      {sorted.map((e, i) => (
        <li key={i} className="relative flex gap-3">
          <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", i === 0 ? "bg-primary" : "bg-border")} />
          <div className="min-w-0 text-sm">
            <p className="font-medium">{humanize(e.status)}</p>
            <p className="text-xs text-muted-foreground">
              {formatDateTime(e.at)} · by {e.actor}
            </p>
            {e.note && <p className="mt-1 text-muted-foreground">{e.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}

export function TestModeNote({ className }: { className?: string }) {
  return (
    <p className={cn("flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-inset ring-amber-200", className)}>
      <FlaskConical className="mt-0.5 size-3.5 shrink-0" />
      <span>
        <strong>Test mode.</strong> Payments are approved instantly and no real money is charged.
      </span>
    </p>
  )
}

export function PriceBreakdown({ lines, total }: { lines: Array<[string, string]>; total: string }) {
  return (
    <div className="space-y-1.5 text-sm">
      {lines.map(([label, value]) => (
        <div key={label} className="flex justify-between text-muted-foreground">
          <span>{label}</span>
          <span className="tabular">{value}</span>
        </div>
      ))}
      <div className="flex justify-between border-t pt-2 font-semibold">
        <span>Total</span>
        <span className="tabular">{total}</span>
      </div>
    </div>
  )
}
