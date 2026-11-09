"use client"

import { useEffect, useRef } from "react"
import { useFormStatus } from "react-dom"
import { AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export type FormState = {
  ok?: boolean
  message?: string
  error?: string
  fieldErrors?: Record<string, string>
  values?: Record<string, string>
}

export function Field({
  label,
  name,
  error,
  hint,
  children,
  className,
}: {
  label: string
  name: string
  error?: string
  hint?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={name}>{label}</Label>
      {children}
      {error ? (
        <p id={`${name}-error`} className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

export function SubmitButton({ children, pendingText, ...props }: ButtonProps & { pendingText?: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending || props.disabled} {...props}>
      {pending && <Loader2 className="animate-spin" />}
      {pending ? (pendingText ?? children) : children}
    </Button>
  )
}

export function FormError({ state }: { state: FormState }) {
  if (!state.error) return null
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800 ring-1 ring-inset ring-red-200">
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <span>{state.error}</span>
    </div>
  )
}

/** Shows a toast when an action succeeds and runs an optional callback (e.g. close a dialog). */
export function useActionFeedback(state: FormState, onSuccess?: () => void) {
  const callback = useRef(onSuccess)
  callback.current = onSuccess
  useEffect(() => {
    if (state.ok) {
      if (state.message) toast.success(state.message)
      callback.current?.()
    }
  }, [state])
}

export const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
