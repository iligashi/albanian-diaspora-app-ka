import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ArrowDownLeft, ArrowUpRight, Gift, RotateCcw } from "lucide-react"
import { PageHeader, Section, TestModeNote } from "@/components/shared/primitives"
import { requireUser } from "@/lib/auth/session"
import { connectDB } from "@/lib/db"
import { formatMoney } from "@/lib/money"
import { User, WalletEntry, WalletInvite } from "@/lib/models"
import { AppError } from "@/lib/services/core"
import { contributions, memberWallet } from "@/lib/services/wallet"
import { cn, formatDateTime, initials } from "@/lib/utils"
import { InviteForm, LeaveWalletButton, TopUpForm } from "../wallet-forms"

export const metadata: Metadata = { title: "Wallet" }

const ENTRY_ICON = { top_up: ArrowDownLeft, payment: ArrowUpRight, refund: RotateCcw, bonus: Gift } as const

export default async function WalletPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("customer")
  await connectDB()
  const wallet = await memberWallet(user.id, (await params).id).catch((e) => {
    if (e instanceof AppError) notFound()
    throw e
  })
  const [people, entries, totals, invites] = await Promise.all([
    User.find({ _id: { $in: wallet.members.map((m) => m.user) } }).select("firstName lastName country").lean(),
    WalletEntry.find({ wallet: wallet._id }).sort({ createdAt: -1 }).limit(50).lean(),
    contributions(wallet._id),
    WalletInvite.find({ wallet: wallet._id, status: "pending" }).select("email").lean(),
  ])
  const name = (id: { toString(): string }) => {
    const p = people.find((u) => u._id.toString() === id.toString())
    return p ? `${p.firstName} ${p.lastName}` : "Former member"
  }
  const isFamily = wallet.kind === "family"
  const totalIn = totals.reduce((s, t) => s + t.toppedUp, 0)

  return (
    <>
      <PageHeader
        title={wallet.name}
        back={{ href: "/wallet", label: "Wallets" }}
        description={isFamily ? `Shared by ${wallet.members.length} ${wallet.members.length === 1 ? "person" : "people"}` : "Your personal credit"}
        actions={isFamily && !wallet.owner.equals(user.id) ? <LeaveWalletButton walletId={wallet._id.toString()} /> : undefined}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="rounded-xl bg-ink p-6 text-ink-foreground">
            <p className="text-sm opacity-70">Balance</p>
            <p className="tabular mt-1 text-4xl font-semibold">{formatMoney(wallet.balanceCents)}</p>
            <p className="mt-2 text-sm opacity-70">Choose this wallet under &ldquo;Pay with&rdquo; when you pay a bill, send a gift or book a service.</p>
          </div>

          {isFamily && (
            <Section title="Who put in what">
              <ul className="divide-y">
                {wallet.members.map((m) => {
                  const t = totals.find((x) => x._id.equals(m.user))
                  const share = totalIn > 0 ? Math.round(((t?.toppedUp ?? 0) / totalIn) * 100) : 0
                  const p = people.find((u) => u._id.equals(m.user))
                  return (
                    <li key={m.user.toString()} className="px-5 py-4 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-3">
                          <span className="grid size-8 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                            {p ? initials(p.firstName, p.lastName) : "?"}
                          </span>
                          <span>
                            <span className="block font-medium">
                              {name(m.user)} {m.user.equals(user.id) && <span className="text-muted-foreground">(you)</span>}
                            </span>
                            <span className="block text-xs text-muted-foreground">{p?.country ?? ""}</span>
                          </span>
                        </span>
                        <span className="text-right">
                          <span className="tabular block font-semibold">{formatMoney(t?.toppedUp ?? 0)}</span>
                          <span className="block text-xs text-muted-foreground">spent {formatMoney(t?.spent ?? 0)}</span>
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${share}%` }} />
                      </div>
                    </li>
                  )
                })}
                {invites.map((i) => (
                  <li key={i._id.toString()} className="flex items-center justify-between px-5 py-3 text-sm text-muted-foreground">
                    <span>{i.email}</span>
                    <span className="text-xs">Invitation pending</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="History">
            {entries.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">Nothing yet. Add money to get started.</p>
            ) : (
              <ul className="divide-y">
                {entries.map((e) => {
                  const Icon = ENTRY_ICON[e.type]
                  return (
                    <li key={e._id.toString()} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                      <span className="flex min-w-0 items-center gap-3">
                        <span className={cn("grid size-8 shrink-0 place-items-center rounded-md", e.amountCents > 0 ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground")}>
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{e.description}</span>
                          <span className="block text-xs text-muted-foreground">
                            {isFamily ? `${name(e.user)} · ` : ""}
                            {formatDateTime(e.createdAt)}
                          </span>
                        </span>
                      </span>
                      <span className={cn("tabular shrink-0 font-semibold", e.amountCents > 0 && "text-emerald-700")}>
                        {e.amountCents > 0 ? "+" : "−"}
                        {formatMoney(Math.abs(e.amountCents))}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </Section>
        </div>

        <div className="space-y-4">
          <Section title="Add money">
            <div className="space-y-3 p-5">
              <TopUpForm walletId={wallet._id.toString()} />
              <TestModeNote />
            </div>
          </Section>
          {isFamily && (
            <Section title="Invite family">
              <div className="p-5">
                <InviteForm walletId={wallet._id.toString()} />
              </div>
            </Section>
          )}
        </div>
      </div>
    </>
  )
}
