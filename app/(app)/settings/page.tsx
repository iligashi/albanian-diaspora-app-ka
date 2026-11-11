import type { Metadata } from "next"
import { PageHeader, Section } from "@/components/shared/primitives"
import { requireUser } from "@/lib/auth/session"
import { User } from "@/lib/models"
import { formatMoney } from "@/lib/money"
import { ensureReferralCode, REFERRAL_BONUS_CENTS } from "@/lib/services/wallet"
import { InviteLink } from "./invite-link"
import { PasswordForm, ProfileForm } from "./settings-forms"

export const metadata: Metadata = { title: "Settings" }

export default async function SettingsPage() {
  const current = await requireUser()
  const user = await User.findById(current.id).lean()
  if (!user) return null
  const code = user.role === "customer" ? await ensureReferralCode(current.id) : null

  return (
    <>
      <PageHeader title="Settings" description={user.email} />
      <div className="grid max-w-2xl gap-6">
        <Section title="Profile">
          <ProfileForm
            values={{ firstName: user.firstName, lastName: user.lastName, phone: user.phone ?? "", country: user.country ?? "" }}
            showCountry={user.role === "customer"}
          />
        </Section>
        {code && (
          <section id="invite" className="scroll-mt-24 rounded-xl border bg-card">
            <header className="border-b px-5 py-3.5">
              <h2 className="text-sm font-semibold">Invite family and friends</h2>
            </header>
            <div className="space-y-3 p-5 text-sm">
              <p className="text-muted-foreground">
                When someone joins with your link and makes their first payment, you both get {formatMoney(REFERRAL_BONUS_CENTS)} in your wallet.
              </p>
              <InviteLink code={code} />
            </div>
          </section>
        )}
        <Section title="Password">
          <PasswordForm />
        </Section>
      </div>
    </>
  )
}
