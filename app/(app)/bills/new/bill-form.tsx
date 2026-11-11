"use client"

import { useActionState, useState } from "react"
import { Field, FormError, SubmitButton, selectClass } from "@/components/shared/form"
import { PaymentOptions } from "@/components/shared/payment-options"
import { PriceBreakdown, TestModeNote } from "@/components/shared/primitives"
import { Input } from "@/components/ui/input"
import { BILL_CATEGORIES, BILL_PROVIDERS, getBillProvider } from "@/lib/domain/catalog"
import { formatMoney, parseMoneyToCents, serviceFeeCents } from "@/lib/money"
import { humanize } from "@/lib/utils"
import type { RecipientOption } from "@/lib/recipient-options"
import type { WalletOption } from "@/lib/wallet-options"
import { payBillAction } from "../../customer-actions"

export function BillForm({ recipients, wallets }: { recipients: RecipientOption[]; wallets: WalletOption[] }) {
  const [state, action] = useActionState(payBillAction, {})
  const v = state.values ?? {}
  const e = state.fieldErrors ?? {}
  const [provider, setProvider] = useState(v.provider ?? "")
  const [amount, setAmount] = useState(v.amount ?? "")

  const cents = parseMoneyToCents(amount)
  const fee = cents ? serviceFeeCents(cents) : 0
  const accountLabel = getBillProvider(provider)?.accountLabel ?? "Account number"

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_320px]" noValidate>
      <div className="space-y-5 rounded-xl border bg-card p-5 sm:p-6">
        <FormError state={state} />
        <Field label="Whose household is this for?" name="recipientId" error={e.recipientId}>
          <select id="recipientId" name="recipientId" defaultValue={v.recipientId ?? recipients[0]?.id} className={selectClass}>
            {recipients.map((r) => (
              <option key={r.id} value={r.id}>
                {r.fullName} — {r.city}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Provider" name="provider" error={e.provider}>
          <select id="provider" name="provider" value={provider} onChange={(ev) => setProvider(ev.target.value)} className={selectClass}>
            <option value="" disabled>
              Choose a provider…
            </option>
            {BILL_CATEGORIES.map((cat) => (
              <optgroup key={cat} label={humanize(cat)}>
                {BILL_PROVIDERS.filter((p) => p.category === cat).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={accountLabel} name="accountNumber" error={e.accountNumber} hint="Exactly as it appears on the bill">
            <Input id="accountNumber" name="accountNumber" defaultValue={v.accountNumber} autoComplete="off" />
          </Field>
          <Field label="Billing period" name="period" error={e.period} hint="Optional, e.g. October 2026">
            <Input id="period" name="period" defaultValue={v.period} />
          </Field>
        </div>
        <Field label="Amount (EUR)" name="amount" error={e.amount}>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
            <Input
              id="amount"
              name="amount"
              inputMode="decimal"
              placeholder="0.00"
              className="pl-7"
              value={amount}
              onChange={(ev) => setAmount(ev.target.value)}
            />
          </div>
        </Field>
      </div>

      <aside className="h-fit space-y-4 rounded-xl border bg-card p-5 lg:sticky lg:top-24">
        <h2 className="text-sm font-semibold">Summary</h2>
        <PriceBreakdown
          lines={[
            ["Bill amount", cents ? formatMoney(cents) : "—"],
            ["Service fee", cents ? formatMoney(fee) : "—"],
          ]}
          total={cents ? formatMoney(cents + fee) : "—"}
        />
        <PaymentOptions wallets={wallets} totalCents={cents ? cents + fee : null} kind="bill" values={v} errors={e} />
        <TestModeNote />
        <SubmitButton className="w-full" pendingText="Processing payment…">
          Pay {cents ? formatMoney(cents + fee) : ""}
        </SubmitButton>
        <p className="text-xs text-muted-foreground">If we can&apos;t pay the provider, you&apos;re refunded in full.</p>
      </aside>
    </form>
  )
}
