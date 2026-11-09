import type { Metadata } from "next"
import { MapPin, Phone, Users } from "lucide-react"
import { EmptyState, PageHeader } from "@/components/shared/primitives"
import { requireUser } from "@/lib/auth/session"
import { Recipient } from "@/lib/models"
import { humanize } from "@/lib/utils"
import { DeleteRecipientButton, RecipientDialog, type RecipientFormValues } from "./recipient-dialog"

export const metadata: Metadata = { title: "Family" }

export default async function FamilyPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await requireUser("customer")
  const { welcome } = await searchParams
  const recipients = await Recipient.find({ owner: user.id }).sort({ createdAt: 1 }).lean()

  return (
    <>
      <PageHeader
        title="Family"
        description="The people you look after in Kosovo. Every bill, gift and booking goes to one of them."
        actions={recipients.length > 0 && <RecipientDialog />}
      />

      {recipients.length === 0 ? (
        <EmptyState
          icon={Users}
          title={welcome ? "Welcome! Who are you looking after?" : "No family members yet"}
          description="Add a parent, grandparent or anyone else in Kosovo. You'll pick them when you pay a bill, send a gift or book a service."
          action={<RecipientDialog defaultOpen={Boolean(welcome)} />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipients.map((r) => {
            const values: RecipientFormValues = {
              id: r._id.toString(),
              fullName: r.fullName,
              relationship: r.relationship,
              phone: r.phone ?? "",
              city: r.city,
              addressLine: r.addressLine,
              notes: r.notes ?? "",
            }
            return (
              <article key={values.id} className="flex flex-col rounded-xl border bg-card p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold">{r.fullName}</h2>
                    <p className="text-xs text-muted-foreground">{humanize(r.relationship)}</p>
                  </div>
                  <span className="grid size-9 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                    {r.fullName.charAt(0)}
                  </span>
                </div>
                <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                  <p className="flex gap-2">
                    <MapPin className="mt-0.5 size-4 shrink-0" />
                    <span>
                      {r.addressLine}, {r.city}
                    </span>
                  </p>
                  {r.phone && (
                    <p className="flex gap-2">
                      <Phone className="mt-0.5 size-4 shrink-0" />
                      {r.phone}
                    </p>
                  )}
                  {r.notes && <p className="rounded-md bg-muted px-2.5 py-1.5 text-xs">{r.notes}</p>}
                </div>
                <div className="mt-auto flex gap-2 pt-4">
                  <RecipientDialog recipient={values} />
                  <DeleteRecipientButton id={values.id} name={r.fullName} />
                </div>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}
