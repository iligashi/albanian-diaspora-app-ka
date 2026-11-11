import { Readable } from "node:stream"
import { getCurrentUser } from "@/lib/auth/session"
import { connectDB } from "@/lib/db"
import { openMedia } from "@/lib/services/media"

/** Streams a delivery photo or voice note to the people on that order, and nobody else. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return new Response("Not found", { status: 404 })
  await connectDB()
  const found = await openMedia({ id: user.id, role: user.role }, (await params).id)
  if (!found) return new Response("Not found", { status: 404 })
  return new Response(Readable.toWeb(found.stream) as ReadableStream, {
    headers: {
      "Content-Type": found.media.contentType,
      "Content-Length": String(found.media.size),
      "Cache-Control": "private, max-age=86400",
      "Content-Disposition": "inline",
    },
  })
}
