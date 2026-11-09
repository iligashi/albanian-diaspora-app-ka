"use client"

import { useActionState, useState } from "react"
import { Pencil, Plus } from "lucide-react"
import { Field, FormError, SubmitButton, selectClass, useActionFeedback } from "@/components/shared/form"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { GIFT_CATEGORIES, SERVICE_CATEGORIES } from "@/lib/domain/catalog"
import { humanize } from "@/lib/utils"
import { saveOfferingAction, saveProductAction } from "../actions"

export type CatalogItem = {
  id: string
  title: string
  category: string
  price: string
  description: string
  active: boolean
  durationMinutes: string
}

export function CatalogItemDialog({ kind, item }: { kind: "gifts" | "services"; item?: CatalogItem }) {
  const [open, setOpen] = useState(false)
  const noun = kind === "gifts" ? "product" : "service"
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {item ? (
          <Button variant="ghost" size="sm">
            <Pencil /> Edit
          </Button>
        ) : (
          <Button>
            <Plus /> Add {noun}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? `Edit ${item.title}` : `Add a ${noun}`}</DialogTitle>
          <DialogDescription>Prices are what you receive. Our service fee is added on top for the customer.</DialogDescription>
        </DialogHeader>
        {open && <CatalogForm kind={kind} item={item} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function CatalogForm({ kind, item, onDone }: { kind: "gifts" | "services"; item?: CatalogItem; onDone: () => void }) {
  const save = kind === "gifts" ? saveProductAction : saveOfferingAction
  const [state, action] = useActionState(save.bind(null, item?.id), {})
  useActionFeedback(state, onDone)
  const v = { ...item, ...state.values }
  const e = state.fieldErrors ?? {}
  const titleField = kind === "gifts" ? "name" : "title"
  const categories = kind === "gifts" ? GIFT_CATEGORIES : SERVICE_CATEGORIES

  return (
    <form action={action} className="space-y-4" noValidate>
      <FormError state={state} />
      <Field label={kind === "gifts" ? "Product name" : "Service title"} name={titleField} error={e[titleField]}>
        <Input id={titleField} name={titleField} defaultValue={(state.values?.[titleField] as string) ?? item?.title} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category" name="category" error={e.category}>
          <select id="category" name="category" defaultValue={v.category ?? ""} className={selectClass}>
            <option value="" disabled>
              Choose…
            </option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {humanize(c)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Price (EUR)" name="price" error={e.price}>
          <Input id="price" name="price" inputMode="decimal" placeholder="0.00" defaultValue={v.price} />
        </Field>
      </div>
      {kind === "services" && (
        <Field label="Typical duration (minutes)" name="durationMinutes" error={e.durationMinutes} hint="Optional">
          <Input id="durationMinutes" name="durationMinutes" type="number" min={15} step={15} defaultValue={v.durationMinutes} />
        </Field>
      )}
      <Field label="Description" name="description" error={e.description} hint="What's included, sizes, anything a customer should know">
        <Textarea id="description" name="description" rows={3} maxLength={1000} defaultValue={v.description} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={item?.active ?? true} className="size-4 accent-[hsl(var(--primary))]" />
        Listed (customers can order it)
      </label>
      <DialogFooter>
        <SubmitButton pendingText="Saving…">{item ? "Save changes" : "Add"}</SubmitButton>
      </DialogFooter>
    </form>
  )
}
