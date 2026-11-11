import "server-only"
import { z } from "zod"

const schema = z.object({
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required (use \"memory\" for an in-memory dev database)"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  PAYMENT_PROVIDER: z.enum(["test"]).default("test"),
  /** Protects /api/cron/daily (recurring plans, reminders). Leave unset to disable the endpoint. */
  CRON_SECRET: z.string().min(24, "CRON_SECRET must be at least 24 characters").optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
})

export type Env = z.infer<typeof schema>

let cached: Env | null = null

/**
 * Validated server environment. Read lazily so `next build` does not need secrets,
 * but the first request fails loudly when configuration is missing.
 */
export function env(): Env {
  if (cached) return cached
  const parsed = schema.safeParse(process.env)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n")
    throw new Error(`Invalid environment configuration:\n${issues}\nSee .env.example.`)
  }
  if (parsed.data.NODE_ENV === "production" && parsed.data.MONGODB_URI === "memory") {
    throw new Error("MONGODB_URI=memory is for local development only.")
  }
  cached = parsed.data
  return cached
}
