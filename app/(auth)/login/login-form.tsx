"use client"

import { useActionState } from "react"
import { Field, FormError, SubmitButton } from "@/components/shared/form"
import { Input } from "@/components/ui/input"
import { login } from "../actions"

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(login, {})
  return (
    <form action={action} className="mt-8 space-y-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <FormError state={state} />
      <Field label="Email" name="email" error={state.fieldErrors?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" defaultValue={state.values?.email} required autoFocus />
      </Field>
      <Field label="Password" name="password" error={state.fieldErrors?.password}>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <SubmitButton className="w-full" pendingText="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  )
}
