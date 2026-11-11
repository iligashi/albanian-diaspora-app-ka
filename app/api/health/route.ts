import mongoose from "mongoose"
import { connectDB } from "@/lib/db"

export const dynamic = "force-dynamic"

/** Liveness and readiness for load balancers and uptime checks. Reveals nothing beyond up/down. */
export async function GET() {
  const started = Date.now()
  try {
    await connectDB()
    await mongoose.connection.db?.admin().ping()
    return Response.json({ status: "ok", db: "up", latencyMs: Date.now() - started }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return Response.json({ status: "degraded", db: "down" }, { status: 503, headers: { "Cache-Control": "no-store" } })
  }
}
