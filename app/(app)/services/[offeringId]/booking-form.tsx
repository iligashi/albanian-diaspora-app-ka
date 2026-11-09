"use client"

import { useActionState } from "react"
import { Field, FormError, SubmitButton, selectClass } from "@/components/shared/form"
import { PriceBreakdown, TestModeNote } from "@/components/shared/primitives"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { TIME_SLOTS } from "@/lib/domain/catalog"
import { formatMoney, serviceFeeCents } from "@/lib/money"
import type { RecipientOption } from "@/lib/recipient-options"
import { requestBookingAction } from "../../customer-actions"

function isoDate(daysAhead: number) {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  return d.toISOString().slice(0, 10)
}

export function BookingForm({
  offering,
  recipients,
  servedCities,
  vendorName,
}: {
  offering: { id: string; title: string; priceCents: number }
  recipients: RecipientOption[]
  servedCities: string[]
  vendorName: string
}) {
  const [state, action] = useActionState(requestBookingAction, {})
  const v = state.values ?? {}
  const e = state.fieldErrors ?? {}
  const eligible = recipients.filter((r) => servedCities.includes(r.city))
  const fee = serviceFeeCents(offering.priceCents)

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_320px]" noValidate>
      <input type="hidden" name="offeringId" value={offering.id} />
      <div className="space-y-5 rounded-xl border bg-card p-5 sm:p-6">
        <FormError state={state} />
        <Field
          label="Whose home?"
          name="recipientId"
          error={e.recipientId}
          hint={eligible.length < recipients.length ? `${vendorName} only works in ${servedCities.join(", ")}.` : undefined}
        >
          <select id="recipientId" name="recipientId" defaultValue={v.recipientId ?? eligible[0]?.id ?? ""} className={selectClass}>
            {eligible.length === 0 && (
              <option value="" disabled>
                None of your family live where this provider works
              </option>
            )}
            {recipients.map((r) => (
              <option key={r.id} value={r.id} disabled={!servedCities.includes(r.city)}>
                {r.fullName} — {r.addressLine}, {r.city}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Date" name="date" error={e.date}>
            <Input id="date" name="date" type="date" min={isoDate(1)} max={isoDate(120)} defaultValue={v.date ?? isoDate(2)} />
          </Field>
          <Field label="Time window" name="timeSlot" error={e.timeSlot} hint="The provider confirms the exact time with your family">
            <select id="timeSlot" name="timeSlot" defaultValue={v.timeSlot ?? ""} className={selectClass}>
              <option value="" disabled>
                Choose…
              </option>
              {TIME_SLOTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Notes for the provider" name="notes" error={e.notes} hint="Optional. Access instructions, what needs doing, who will be home">
          <Textarea id="notes" name="notes" rows={4} maxLength={1000} defaultValue={v.notes} />
        </Field>
      </div>

      <aside className="h-fit space-y-4 rounded-xl border bg-card p-5 lg:sticky lg:top-24">
        <h2 className="text-sm font-semibold">Summary</h2>
        <PriceBreakdown
          lines={[
            [offering.title, formatMoney(offering.priceCents)],
            ["Service fee", formatMoney(fee)],
          ]}
          total={formatMoney(offering.priceCents + fee)}
        />
        <TestModeNote />
        <SubmitButton className="w-full" disabled={eligible.length === 0} pendingText="Booking…">
          Book and pay {formatMoney(offering.priceCents + fee)}
        </SubmitButton>
        <p className="text-xs text-muted-foreground">Cancel any time before the job starts for a full refund.</p>
      </aside>
    </form>
  )
}
