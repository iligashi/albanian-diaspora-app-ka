"use client"

import { useActionState, useState } from "react"
import { useRouter } from "next/navigation"
import { Gift, Wrench } from "lucide-react"
import { Field, FormError, SubmitButton, selectClass, useActionFeedback } from "@/components/shared/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CITIES } from "@/lib/domain/catalog"
import { cn } from "@/lib/utils"
import { saveVendorProfileAction } from "../actions"

type Existing = {
  businessName: string
  kind: "gifts" | "services"
  phone: string
  city: string
  serviceCities: string[]
  description: string
} | null

const KINDS = [
  { value: "gifts", label: "Gift shop", hint: "Flowers, cakes, baskets…", icon: Gift },
  { value: "services", label: "Home services", hint: "Cleaning, repairs, care…", icon: Wrench },
] as const

export function VendorProfileForm({ existing }: { existing: Existing }) {
  const router = useRouter()
  const [state, action] = useActionState(saveVendorProfileAction, {})
  useActionFeedback(state, () => {
    if (!existing) router.push("/vendor")
  })
  const v = state.values ?? {}
  const e = state.fieldErrors ?? {}
  const [kind, setKind] = useState<string>(existing?.kind ?? v.kind ?? "gifts")
  const [cities, setCities] = useState<string[]>(existing?.serviceCities ?? [])

  return (
    <form action={action} className="max-w-3xl space-y-6 rounded-xl border bg-card p-5 sm:p-6" noValidate>
      <FormError state={state} />
      <fieldset disabled={!!existing}>
        <legend className="mb-2 text-sm font-medium">What do you offer?</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {KINDS.map((k) => (
            <label
              key={k.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-sm transition-colors has-[:disabled]:cursor-not-allowed has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                kind === k.value ? "border-primary bg-accent" : "hover:border-foreground/30",
              )}
            >
              <input type="radio" name="kind" value={k.value} checked={kind === k.value} onChange={() => setKind(k.value)} className="sr-only" />
              <k.icon className={cn("mt-0.5 size-5", kind === k.value ? "text-primary" : "text-muted-foreground")} />
              <span>
                <span className="block font-medium">{k.label}</span>
                <span className="text-xs text-muted-foreground">{k.hint}</span>
              </span>
            </label>
          ))}
        </div>
        {existing && <input type="hidden" name="kind" value={existing.kind} />}
        {existing && <p className="mt-2 text-xs text-muted-foreground">Contact support to change what your business offers.</p>}
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Business name" name="businessName" error={e.businessName}>
          <Input id="businessName" name="businessName" defaultValue={v.businessName ?? existing?.businessName} />
        </Field>
        <Field label="Business phone" name="phone" error={e.phone} hint="Shown to customers after they order">
          <Input id="phone" name="phone" type="tel" placeholder="+383 44 000 000" defaultValue={v.phone ?? existing?.phone} />
        </Field>
        <Field label="Based in" name="city" error={e.city}>
          <select id="city" name="city" defaultValue={v.city ?? existing?.city ?? ""} className={selectClass}>
            <option value="" disabled>
              Choose…
            </option>
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
      </div>

      <fieldset>
        <legend className="text-sm font-medium">{kind === "gifts" ? "Towns you deliver to" : "Towns you work in"}</legend>
        <p className="mb-3 text-xs text-muted-foreground">Customers only see you when their family lives in one of these.</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CITIES.map((c) => (
            <label key={c} className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-accent">
              <input
                type="checkbox"
                name="serviceCities"
                value={c}
                checked={cities.includes(c)}
                onChange={(ev) => setCities((prev) => (ev.target.checked ? [...prev, c] : prev.filter((x) => x !== c)))}
                className="accent-[hsl(var(--primary))]"
              />
              {c}
            </label>
          ))}
        </div>
        {e.serviceCities && <p className="mt-2 text-xs font-medium text-destructive">{e.serviceCities}</p>}
      </fieldset>

      <Field label="About your business" name="description" error={e.description} hint="Optional. What makes you trustworthy? Years in business, insurance, specialities">
        <Textarea id="description" name="description" rows={4} maxLength={1000} defaultValue={v.description ?? existing?.description} />
      </Field>

      <SubmitButton pendingText="Saving…">{existing ? "Save changes" : "Submit for review"}</SubmitButton>
    </form>
  )
}
