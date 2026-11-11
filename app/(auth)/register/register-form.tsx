"use client"

import { useActionState, useState } from "react"
import { HeartHandshake, Store } from "lucide-react"
import { Field, FormError, SubmitButton } from "@/components/shared/form"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { register } from "../actions"

const TYPES = [
  { value: "customer", label: "I'm abroad", hint: "Look after family in Kosovo", icon: HeartHandshake },
  { value: "vendor", label: "I'm a business", hint: "Sell gifts or services", icon: Store },
] as const

export function RegisterForm({ initialType, referral }: { initialType: "customer" | "vendor"; referral?: string }) {
  const [state, action] = useActionState(register, {})
  const [type, setType] = useState<"customer" | "vendor">((state.values?.accountType as "vendor") ?? initialType)
  const v = state.values ?? {}
  const e = state.fieldErrors ?? {}

  return (
    <form action={action} className="mt-8 space-y-4" noValidate>
      <FormError state={state} />
      {referral ? <input type="hidden" name="ref" value={referral} /> : null}
      <fieldset>
        <legend className="sr-only">Account type</legend>
        <div className="grid grid-cols-2 gap-3">
          {TYPES.map((t) => (
            <label
              key={t.value}
              className={cn(
                "flex cursor-pointer flex-col gap-1 rounded-lg border p-3 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                type === t.value ? "border-primary bg-accent" : "hover:border-foreground/30",
              )}
            >
              <input
                type="radio"
                name="accountType"
                value={t.value}
                checked={type === t.value}
                onChange={() => setType(t.value)}
                className="sr-only"
              />
              <t.icon className={cn("size-4", type === t.value ? "text-primary" : "text-muted-foreground")} />
              <span className="font-medium">{t.label}</span>
              <span className="text-xs text-muted-foreground">{t.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name" name="firstName" error={e.firstName}>
          <Input id="firstName" name="firstName" autoComplete="given-name" defaultValue={v.firstName} required />
        </Field>
        <Field label="Last name" name="lastName" error={e.lastName}>
          <Input id="lastName" name="lastName" autoComplete="family-name" defaultValue={v.lastName} required />
        </Field>
      </div>
      <Field label="Email" name="email" error={e.email}>
        <Input id="email" name="email" type="email" autoComplete="email" defaultValue={v.email} required />
      </Field>
      {type === "customer" && (
        <Field label="Country you live in" name="country" error={e.country} hint="Optional">
          <Input id="country" name="country" autoComplete="country-name" placeholder="e.g. Germany" defaultValue={v.country} />
        </Field>
      )}
      <Field label="Password" name="password" error={e.password} hint="At least 10 characters, with letters and numbers.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
      </Field>
      <SubmitButton className="w-full" pendingText="Creating account…">
        {type === "vendor" ? "Continue to business setup" : "Create account"}
      </SubmitButton>
    </form>
  )
}
