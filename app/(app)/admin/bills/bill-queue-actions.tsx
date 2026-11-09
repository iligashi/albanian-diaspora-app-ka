"use client"

import { useActionState, useState } from "react"
import { Field, FormError, SubmitButton, useActionFeedback } from "@/components/shared/form"
import { TransitionButtons } from "@/components/shared/transition-buttons"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { refundBillAction, settleBillAction } from "../actions"

export function BillQueueActions({ billId }: { billId: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex shrink-0 gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>Mark settled</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record provider payment</DialogTitle>
            <DialogDescription>Enter the receipt or transaction number the provider gave you. The customer sees it as proof of payment.</DialogDescription>
          </DialogHeader>
          {open && <SettleForm billId={billId} onDone={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
      <TransitionButtons actions={[{ to: "refunded", label: "Refund", refunds: true }]} run={refundBillAction.bind(null, billId)} withNote />
    </div>
  )
}

function SettleForm({ billId, onDone }: { billId: string; onDone: () => void }) {
  const [state, action] = useActionState(settleBillAction, {})
  useActionFeedback(state, onDone)
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="billId" value={billId} />
      <FormError state={state} />
      <Field label="Provider receipt number" name="settlementReference" error={state.fieldErrors?.settlementReference}>
        <Input id="settlementReference" name="settlementReference" autoFocus autoComplete="off" />
      </Field>
      <DialogFooter>
        <SubmitButton pendingText="Saving…">Mark settled</SubmitButton>
      </DialogFooter>
    </form>
  )
}
