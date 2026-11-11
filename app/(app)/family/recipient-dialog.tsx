"use client"

import { useActionState, useState, useTransition } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Field, FormError, SubmitButton, selectClass, useActionFeedback } from "@/components/shared/form"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CITIES, RELATIONSHIPS } from "@/lib/domain/catalog"
import { humanize } from "@/lib/utils"
import { deleteRecipientAction, saveRecipientAction } from "../customer-actions"

export type RecipientFormValues = {
  id: string
  fullName: string
  relationship: string
  phone: string
  city: string
  addressLine: string
  notes: string
  birthdayMonth?: string
  birthdayDay?: string
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

export function RecipientDialog({ recipient, defaultOpen = false }: { recipient?: RecipientFormValues; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {recipient ? (
          <Button variant="outline" size="sm">
            <Pencil /> Edit
          </Button>
        ) : (
          <Button>
            <Plus /> Add family member
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{recipient ? `Edit ${recipient.fullName}` : "Add a family member"}</DialogTitle>
          <DialogDescription>Shops and providers use these details to reach them, so make sure the address is complete.</DialogDescription>
        </DialogHeader>
        {/* Remount on open so the form starts clean each time. */}
        {open && <RecipientForm recipient={recipient} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function RecipientForm({ recipient, onDone }: { recipient?: RecipientFormValues; onDone: () => void }) {
  const [state, action] = useActionState(saveRecipientAction.bind(null, recipient?.id), {})
  useActionFeedback(state, onDone)
  const v = { ...recipient, ...state.values }
  const e = state.fieldErrors ?? {}

  return (
    <form action={action} className="space-y-4" noValidate>
      <FormError state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" name="fullName" error={e.fullName}>
          <Input id="fullName" name="fullName" defaultValue={v.fullName} required />
        </Field>
        <Field label="Relationship" name="relationship" error={e.relationship}>
          <select id="relationship" name="relationship" defaultValue={v.relationship ?? ""} className={selectClass} required>
            <option value="" disabled>
              Choose…
            </option>
            {RELATIONSHIPS.map((r) => (
              <option key={r} value={r}>
                {humanize(r)}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City" name="city" error={e.city}>
          <select id="city" name="city" defaultValue={v.city ?? ""} className={selectClass} required>
            <option value="" disabled>
              Choose…
            </option>
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Phone" name="phone" error={e.phone} hint="Optional, used for deliveries">
          <Input id="phone" name="phone" type="tel" placeholder="+383 44 123 456" defaultValue={v.phone} />
        </Field>
      </div>
      <Field label="Address" name="addressLine" error={e.addressLine}>
        <Input id="addressLine" name="addressLine" placeholder="Street, number, neighbourhood or village" defaultValue={v.addressLine} required />
      </Field>
      <Field label="Notes for vendors" name="notes" error={e.notes} hint="Optional. e.g. which floor, who to call first">
        <Textarea id="notes" name="notes" rows={2} defaultValue={v.notes} />
      </Field>
      <Field label="Birthday" name="birthdayMonth" error={e.birthdayMonth ?? e.birthdayDay} hint="Optional. We'll remind you a few days before so a gift arrives on the day.">
        <div className="grid grid-cols-[1fr_96px] gap-2">
          <select id="birthdayMonth" name="birthdayMonth" defaultValue={v.birthdayMonth ?? ""} className={selectClass} aria-label="Birthday month">
            <option value="">Month</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select id="birthdayDay" name="birthdayDay" defaultValue={v.birthdayDay ?? ""} className={selectClass} aria-label="Birthday day">
            <option value="">Day</option>
            {Array.from({ length: 31 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </div>
      </Field>
      <DialogFooter>
        <SubmitButton pendingText="Saving…">{recipient ? "Save changes" : "Add family member"}</SubmitButton>
      </DialogFooter>
    </form>
  )
}

export function DeleteRecipientButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
          <Trash2 /> Remove
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove {name}?</DialogTitle>
          <DialogDescription>Past orders keep their details. You just won&apos;t be able to send new ones to {name} until you add them again.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await deleteRecipientAction(id)
                if (res.error) toast.error(res.error)
                else {
                  toast.success(res.message)
                  setOpen(false)
                }
              })
            }
          >
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
