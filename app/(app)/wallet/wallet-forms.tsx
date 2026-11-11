"use client"

import { useActionState, useRef, useTransition } from "react"
import { toast } from "sonner"
import { Field, FormError, SubmitButton, useActionFeedback } from "@/components/shared/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createWalletAction, inviteAction, leaveWalletAction, respondToInviteAction, topUpAction } from "./actions"

export function CreateWalletForm() {
  const [state, action] = useActionState(createWalletAction, {})
  return (
    <form action={action} className="space-y-3" noValidate>
      <FormError state={state} />
      <Field label="Name" name="name" error={state.fieldErrors?.name} hint="For example: Krasniqi family, or Mom & Dad">
        <Input id="name" name="name" placeholder="Krasniqi family" defaultValue={state.values?.name} maxLength={80} />
      </Field>
      <SubmitButton pendingText="Creating…">Create shared wallet</SubmitButton>
    </form>
  )
}

const QUICK_AMOUNTS = ["20", "50", "100", "200"]

export function TopUpForm({ walletId }: { walletId: string }) {
  const [state, action] = useActionState(topUpAction, {})
  const amount = useRef<HTMLInputElement>(null)
  useActionFeedback(state, () => amount.current && (amount.current.value = ""))
  return (
    <form action={action} className="space-y-3" noValidate>
      <input type="hidden" name="walletId" value={walletId} />
      <FormError state={state} />
      <div className="flex flex-wrap gap-2">
        {QUICK_AMOUNTS.map((a) => (
          <Button key={a} type="button" variant="outline" size="sm" onClick={() => amount.current && (amount.current.value = a)}>
            €{a}
          </Button>
        ))}
      </div>
      <Field label="Amount (EUR)" name="amount" error={state.fieldErrors?.amount}>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
          <Input ref={amount} id="amount" name="amount" inputMode="decimal" placeholder="50.00" className="pl-7" />
        </div>
      </Field>
      <SubmitButton className="w-full" pendingText="Adding money…">
        Add money by card
      </SubmitButton>
    </form>
  )
}

export function InviteForm({ walletId }: { walletId: string }) {
  const [state, action] = useActionState(inviteAction, {})
  const email = useRef<HTMLInputElement>(null)
  useActionFeedback(state, () => email.current && (email.current.value = ""))
  return (
    <form action={action} className="space-y-3" noValidate>
      <input type="hidden" name="walletId" value={walletId} />
      <FormError state={state} />
      <Field label="Their email" name="email" error={state.fieldErrors?.email} hint="If they don't have an account yet, they'll see the invitation when they sign up with this email.">
        <Input ref={email} id="email" name="email" type="email" placeholder="sister@example.com" />
      </Field>
      <SubmitButton variant="outline" pendingText="Inviting…">
        Invite to wallet
      </SubmitButton>
    </form>
  )
}

export function InviteResponse({ inviteId }: { inviteId: string }) {
  const [pending, start] = useTransition()
  const respond = (accept: boolean) =>
    start(async () => {
      const res = await respondToInviteAction(inviteId, accept)
      if (res.error) toast.error(res.error)
      else toast.success(res.message)
    })
  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={pending} onClick={() => respond(true)}>
        Join
      </Button>
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => respond(false)}>
        Decline
      </Button>
    </div>
  )
}

export function LeaveWalletButton({ walletId }: { walletId: string }) {
  const [pending, start] = useTransition()
  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-muted-foreground hover:text-destructive"
      disabled={pending}
      onClick={() => {
        if (!confirm("Leave this wallet? The money stays in it for the others.")) return
        start(async () => {
          const res = await leaveWalletAction(walletId)
          if (res?.error) toast.error(res.error)
        })
      }}
    >
      Leave wallet
    </Button>
  )
}
