"use client"

import { useState } from "react"
import { CreditCard, Repeat, Users, Wallet } from "lucide-react"
import { Field, selectClass } from "@/components/shared/form"
import { REPEAT_OPTIONS } from "@/lib/domain/plans"
import { formatMoney } from "@/lib/money"
import { cn } from "@/lib/utils"
import type { WalletOption } from "@/lib/wallet-options"

const REPEAT_HINTS = {
  bill: "We'll pay the same amount on the same day each time. Pause or cancel anytime under Plans.",
  gift: "We'll order it again so it arrives on the same date each time. Perfect for birthdays.",
  booking: "We'll book the same service and time slot each time. Pause or cancel anytime under Plans.",
}

/** Sensible repeat choices per order type: bills are monthly, gifts mark dates, services recur. */
const ALLOWED_REPEATS: Record<keyof typeof REPEAT_HINTS, string[]> = {
  bill: ["once", "monthly"],
  gift: ["once", "monthly", "yearly"],
  booking: ["once", "weekly", "biweekly", "monthly"],
}

/** "Pay with" (card or a wallet) and "Repeat" for the bill, gift and booking forms. */
export function PaymentOptions({
  wallets,
  totalCents,
  kind,
  values,
  errors,
}: {
  wallets: WalletOption[]
  totalCents: number | null
  kind: keyof typeof REPEAT_HINTS
  values: Record<string, string>
  errors: Record<string, string>
}) {
  const [payWith, setPayWith] = useState(values.payWith ?? "card")
  const [repeat, setRepeat] = useState(values.repeat ?? "once")
  const usable = wallets.filter((w) => w.balanceCents > 0 || w.kind === "family")

  return (
    <div className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="mb-1.5 text-sm font-medium">Pay with</legend>
        <Option name="payWith" value="card" checked={payWith === "card"} onChange={setPayWith} icon={CreditCard} title="Card" detail="Charged when you confirm" />
        {usable.map((w) => {
          const short = totalCents !== null && w.balanceCents < totalCents
          return (
            <Option
              key={w.id}
              name="payWith"
              value={w.id}
              checked={payWith === w.id}
              onChange={setPayWith}
              icon={w.kind === "family" ? Users : Wallet}
              title={w.name}
              detail={`${formatMoney(w.balanceCents)} available${w.kind === "family" ? ` · shared by ${w.members}` : ""}`}
              warning={short ? "Not enough for this order. Top it up first." : undefined}
            />
          )
        })}
        {errors.payWith ? <p className="text-xs font-medium text-destructive">{errors.payWith}</p> : null}
      </fieldset>

      <Field label="Repeat" name="repeat" error={errors.repeat} hint={repeat !== "once" ? REPEAT_HINTS[kind] : undefined}>
        <div className="relative">
          <Repeat className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <select id="repeat" name="repeat" value={repeat} onChange={(e) => setRepeat(e.target.value)} className={cn(selectClass, "pl-9")}>
            {REPEAT_OPTIONS.filter((o) => ALLOWED_REPEATS[kind].includes(o.value)).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </Field>
    </div>
  )
}

function Option({
  name,
  value,
  checked,
  onChange,
  icon: Icon,
  title,
  detail,
  warning,
}: {
  name: string
  value: string
  checked: boolean
  onChange: (value: string) => void
  icon: React.ComponentType<{ className?: string }>
  title: string
  detail: string
  warning?: string
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
        checked ? "border-primary bg-accent" : "hover:border-foreground/30",
      )}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} className="sr-only" />
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-md", checked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{detail}</span>
        {warning && checked ? <span className="mt-1 block text-xs font-medium text-amber-700">{warning}</span> : null}
      </span>
    </label>
  )
}
