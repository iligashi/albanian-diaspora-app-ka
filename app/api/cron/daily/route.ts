import { timingSafeEqual } from "node:crypto"
import { connectDB } from "@/lib/db"
import { env } from "@/lib/env"
import { runDuePlans } from "@/lib/services/plans"
import { sendBirthdayReminders } from "@/lib/services/reminders"

/**
 * Runs recurring plans and birthday reminders. Call it from a scheduler (Vercel
 * Cron, GitHub Actions, crontab) with `Authorization: Bearer $CRON_SECRET`.
 * Running it more often is safe: plans are claimed atomically and reminders are sent once.
 */
export async function GET(request: Request) {
  const secret = env().CRON_SECRET
  const given = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? ""
  const ok = Boolean(secret) && given.length === secret!.length && timingSafeEqual(Buffer.from(given), Buffer.from(secret!))
  if (!ok) return new Response("Unauthorized", { status: 401 })

  await connectDB()
  const plans = await runDuePlans()
  const reminders = await sendBirthdayReminders()
  return Response.json({ plans, reminders })
}
