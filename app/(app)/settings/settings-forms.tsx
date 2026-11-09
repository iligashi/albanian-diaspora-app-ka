"use client"

import { useActionState, useRef } from "react"
import { Field, FormError, SubmitButton, useActionFeedback } from "@/components/shared/form"
import { Input } from "@/components/ui/input"
import { changePasswordAction, updateProfileAction } from "../account-actions"

export function ProfileForm({ values, showCountry }: { values: Record<string, string>; showCountry: boolean }) {
  const [state, action] = useActionState(updateProfileAction, {})
  useActionFeedback(state)
  const v = { ...values, ...state.values }
  const e = state.fieldErrors ?? {}
  return (
    <form action={action} className="space-y-4 p-5" noValidate>
      <FormError state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" name="firstName" error={e.firstName}>
          <Input id="firstName" name="firstName" defaultValue={v.firstName} autoComplete="given-name" />
        </Field>
        <Field label="Last name" name="lastName" error={e.lastName}>
          <Input id="lastName" name="lastName" defaultValue={v.lastName} autoComplete="family-name" />
        </Field>
        <Field label="Phone" name="phone" error={e.phone} hint="Optional">
          <Input id="phone" name="phone" type="tel" defaultValue={v.phone} autoComplete="tel" />
        </Field>
        {showCountry && (
          <Field label="Country you live in" name="country" error={e.country} hint="Optional">
            <Input id="country" name="country" defaultValue={v.country} autoComplete="country-name" />
          </Field>
        )}
      </div>
      <SubmitButton pendingText="Saving…">Save profile</SubmitButton>
    </form>
  )
}

export function PasswordForm() {
  const [state, action] = useActionState(changePasswordAction, {})
  const formRef = useRef<HTMLFormElement>(null)
  useActionFeedback(state, () => formRef.current?.reset())
  const e = state.fieldErrors ?? {}
  return (
    <form ref={formRef} action={action} className="space-y-4 p-5" noValidate>
      <FormError state={state} />
      <Field label="Current password" name="currentPassword" error={e.currentPassword}>
        <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="New password" name="newPassword" error={e.newPassword} hint="10+ characters, letters and numbers">
          <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" />
        </Field>
        <Field label="Confirm new password" name="confirmPassword" error={e.confirmPassword}>
          <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" />
        </Field>
      </div>
      <SubmitButton pendingText="Updating…">Change password</SubmitButton>
    </form>
  )
}
