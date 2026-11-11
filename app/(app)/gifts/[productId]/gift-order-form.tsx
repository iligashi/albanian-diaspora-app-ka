"use client"

import { useActionState, useState } from "react"
import { Field, FormError, SubmitButton, selectClass } from "@/components/shared/form"
import { PaymentOptions } from "@/components/shared/payment-options"
import { PriceBreakdown, TestModeNote } from "@/components/shared/primitives"
import { VoiceRecorder } from "@/components/shared/voice-recorder"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { formatMoney, serviceFeeCents } from "@/lib/money"
import type { RecipientOption } from "@/lib/recipient-options"
import type { WalletOption } from "@/lib/wallet-options"
import { placeGiftOrderAction } from "../../customer-actions"

function isoDate(daysAhead: number) {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  return d.toISOString().slice(0, 10)
}

export function GiftOrderForm({
  product,
  recipients,
  servedCities,
  vendorName,
  wallets,
  preselect,
}: {
  product: { id: string; name: string; priceCents: number }
  recipients: RecipientOption[]
  servedCities: string[]
  vendorName: string
  wallets: WalletOption[]
  preselect?: string
}) {
  const [state, action] = useActionState(placeGiftOrderAction, {})
  const v = state.values ?? {}
  const e = state.fieldErrors ?? {}
  const eligible = recipients.filter((r) => servedCities.includes(r.city))
  const [quantity, setQuantity] = useState(Number(v.quantity ?? 1))
  const [message, setMessage] = useState(v.message ?? "")

  const subtotal = product.priceCents * (quantity || 1)
  const fee = serviceFeeCents(subtotal)

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_320px]" noValidate>
      <input type="hidden" name="productId" value={product.id} />
      <div className="space-y-5 rounded-xl border bg-card p-5 sm:p-6">
        <FormError state={state} />
        <Field
          label="Send to"
          name="recipientId"
          error={e.recipientId}
          hint={eligible.length < recipients.length ? `${vendorName} only delivers to ${servedCities.join(", ")}.` : undefined}
        >
          <select id="recipientId" name="recipientId" defaultValue={v.recipientId ?? (eligible.some((r) => r.id === preselect) ? preselect : eligible[0]?.id) ?? ""} className={selectClass}>
            {eligible.length === 0 && (
              <option value="" disabled>
                None of your family live where this shop delivers
              </option>
            )}
            {recipients.map((r) => (
              <option key={r.id} value={r.id} disabled={!servedCities.includes(r.city)}>
                {r.fullName} — {r.city}
                {servedCities.includes(r.city) ? "" : " (not delivered)"}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Quantity" name="quantity" error={e.quantity}>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min={1}
              max={20}
              value={quantity}
              onChange={(ev) => setQuantity(Math.max(1, Math.min(20, Number(ev.target.value) || 1)))}
            />
          </Field>
          <Field label="Delivery date" name="deliveryDate" error={e.deliveryDate}>
            <Input id="deliveryDate" name="deliveryDate" type="date" min={isoDate(1)} max={isoDate(120)} defaultValue={v.deliveryDate ?? isoDate(2)} />
          </Field>
        </div>
        <Field label="Gift message" name="message" error={e.message} hint={`${message.length}/500 · Printed on a card and delivered with the gift`}>
          <Textarea id="message" name="message" rows={4} maxLength={500} value={message} onChange={(ev) => setMessage(ev.target.value)} placeholder="Gëzuar ditëlindjen…" />
        </Field>
        <Field label="Voice message" name="voiceNote" error={e.voiceNote}>
          <VoiceRecorder name="voiceNote" />
        </Field>
      </div>

      <aside className="h-fit space-y-4 rounded-xl border bg-card p-5 lg:sticky lg:top-24">
        <h2 className="text-sm font-semibold">Summary</h2>
        <PriceBreakdown
          lines={[
            [`${product.name} × ${quantity}`, formatMoney(subtotal)],
            ["Service fee", formatMoney(fee)],
          ]}
          total={formatMoney(subtotal + fee)}
        />
        <PaymentOptions wallets={wallets} totalCents={subtotal + fee} kind="gift" values={v} errors={e} />
        <TestModeNote />
        <SubmitButton className="w-full" disabled={eligible.length === 0} pendingText="Placing order…">
          Pay {formatMoney(subtotal + fee)}
        </SubmitButton>
        <p className="text-xs text-muted-foreground">You can cancel for a full refund until the shop accepts the order.</p>
      </aside>
    </form>
  )
}
