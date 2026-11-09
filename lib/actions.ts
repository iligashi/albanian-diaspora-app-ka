import "server-only"
import { unstable_rethrow } from "next/navigation"
import { ZodError, type z } from "zod"
import { TransitionError } from "./domain/workflow"
import { connectDB } from "./db"
import { AppError } from "./services/core"

export type ActionState = {
  ok?: boolean
  message?: string
  error?: string
  fieldErrors?: Record<string, string>
  /** Echo of submitted values so forms keep their input after a validation error. */
  values?: Record<string, string>
}

export class ValidationFailed extends Error {
  constructor(
    public fieldErrors: Record<string, string>,
    public values: Record<string, string>,
  ) {
    super("Validation failed")
  }
}

/** Parses FormData with a zod schema. Multi-value fields (checkbox groups) are passed as arrays. */
export function parseForm<S extends z.ZodTypeAny>(schema: S, formData: FormData, arrays: string[] = []): z.infer<S> {
  const raw: Record<string, unknown> = {}
  const values: Record<string, string> = {}
  for (const key of new Set(formData.keys())) {
    if (key.startsWith("$ACTION")) continue
    if (arrays.includes(key)) {
      raw[key] = formData.getAll(key).map(String)
    } else {
      const value = String(formData.get(key) ?? "")
      raw[key] = value
      if (!/password/i.test(key)) values[key] = value
    }
  }
  for (const key of arrays) raw[key] ??= []
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form")
      fieldErrors[key] ??= issue.message
    }
    throw new ValidationFailed(fieldErrors, values)
  }
  return parsed.data
}

/**
 * Wraps a server action body: connects to the DB and turns known errors into a
 * result the form can display. Unknown errors are logged and shown generically.
 */
export async function runAction(fn: () => Promise<ActionState | void>): Promise<ActionState> {
  try {
    await connectDB()
    return (await fn()) ?? { ok: true }
  } catch (error) {
    unstable_rethrow(error)
    if (error instanceof ValidationFailed) return { fieldErrors: error.fieldErrors, values: error.values }
    if (error instanceof AppError || error instanceof TransitionError) return { error: error.message }
    if (error instanceof ZodError) return { error: "That request wasn't valid. Refresh the page and try again." }
    console.error("[action] unexpected error", error)
    return { error: "Something went wrong on our side. Please try again." }
  }
}
