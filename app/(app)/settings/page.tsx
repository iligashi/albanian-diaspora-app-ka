import type { Metadata } from "next"
import { PageHeader, Section } from "@/components/shared/primitives"
import { requireUser } from "@/lib/auth/session"
import { User } from "@/lib/models"
import { PasswordForm, ProfileForm } from "./settings-forms"

export const metadata: Metadata = { title: "Settings" }

export default async function SettingsPage() {
  const current = await requireUser()
  const user = await User.findById(current.id).lean()
  if (!user) return null

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
        <Section title="Password">
          <PasswordForm />
        </Section>
      </div>
    </>
  )
}
