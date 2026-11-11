import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Gift, Users, Wallet } from "lucide-react"
import { PageHeader, Section } from "@/components/shared/primitives"
import { requireUser } from "@/lib/auth/session"
import { connectDB } from "@/lib/db"
import { formatMoney } from "@/lib/money"
import { pendingInvitesFor, REFERRAL_BONUS_CENTS, walletsFor } from "@/lib/services/wallet"
import { CreateWalletForm, InviteResponse } from "./wallet-forms"

export const metadata: Metadata = { title: "Wallets" }

export default async function WalletsPage() {
  const user = await requireUser("customer")
  await connectDB()
  const [wallets, invites] = await Promise.all([walletsFor(user.id), pendingInvitesFor(user.email)])
  const family = wallets.filter((w) => w.kind === "family")
  const personal = wallets.find((w) => w.kind === "personal")

  return (
    <>
      <PageHeader
        title="Wallets"
        description="Share family costs with your brothers and sisters abroad. Everyone tops up, everyone can pay, and everyone sees where the money went."
      />

      {invites.length > 0 && (
        <Section title="Invitations" className="mb-6 border-primary/40">
          <ul className="divide-y">
            {invites.map((i) => (
              <li key={i._id.toString()} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm">
                <span>
                  <strong>{(i.invitedBy as unknown as { firstName: string }).firstName}</strong> invited you to <strong>{i.wallet.name}</strong>
                </span>
                <InviteResponse inviteId={i._id.toString()} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {family.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card p-6 text-sm">
              <p className="flex items-center gap-2 font-semibold">
                <Users className="size-4 text-primary" /> No shared wallet yet
              </p>
              <p className="mt-2 text-muted-foreground">
                Create one for your parents&apos; household, invite your siblings, and pay bills, gifts and services from it. No more
                &ldquo;I always pay&rdquo;: you&apos;ll all see who put in what.
              </p>
            </div>
          ) : (
            family.map((w) => (
              <Link key={w._id.toString()} href={`/wallet/${w._id}`} className="flex items-center justify-between gap-4 rounded-xl border bg-card p-5 transition-colors hover:border-foreground/20">
                <span className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
                    <Users className="size-5" />
                  </span>
                  <span>
                    <span className="block font-semibold">{w.name}</span>
                    <span className="block text-xs text-muted-foreground">Shared by {w.members.length} {w.members.length === 1 ? "person" : "people"}</span>
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="tabular text-lg font-semibold">{formatMoney(w.balanceCents)}</span>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </span>
              </Link>
            ))
          )}
          {personal && (
            <Link href={`/wallet/${personal._id}`} className="flex items-center justify-between gap-4 rounded-xl border bg-card p-5 transition-colors hover:border-foreground/20">
              <span className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                  <Wallet className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold">My wallet</span>
                  <span className="block text-xs text-muted-foreground">Personal credit, invite bonuses</span>
                </span>
              </span>
              <span className="tabular text-lg font-semibold">{formatMoney(personal.balanceCents)}</span>
            </Link>
          )}
        </div>

        <div className="space-y-4">
          <Section title="New shared wallet">
            <div className="p-5">
              <CreateWalletForm />
            </div>
          </Section>
          <Link href="/settings#invite" className="flex items-start gap-3 rounded-xl border bg-card p-5 text-sm transition-colors hover:border-foreground/20">
            <Gift className="mt-0.5 size-5 shrink-0 text-primary" />
            <span>
              <span className="block font-semibold">Invite a cousin, both get {formatMoney(REFERRAL_BONUS_CENTS)}</span>
              <span className="block text-muted-foreground">Share your invite link from Settings.</span>
            </span>
          </Link>
        </div>
      </div>
    </>
  )
}
