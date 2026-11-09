import { NextResponse, type NextRequest } from "next/server"
import { SESSION_COOKIE } from "@/lib/auth/token"

/**
 * Clears a session cookie that is still validly signed but no longer belongs to
 * an active user (account disabled or deleted). Without this, middleware would
 * keep bouncing between /login and the app.
 */
export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url))
  response.cookies.delete(SESSION_COOKIE)
  return response
}
