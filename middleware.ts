import { NextResponse, type NextRequest } from "next/server"
import { homeFor, SESSION_COOKIE, verifySession } from "./lib/auth/token"

/**
 * First line of defence: bounce anonymous users to /login and keep each role in
 * its own area. Pages and server actions still call `requireUser`, which also
 * checks the account is active in the database.
 */
const AREAS: Array<{ prefix: string; roles: string[] }> = [
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/vendor", roles: ["vendor"] },
  {
    prefix: "/dashboard",
    roles: ["customer"],
  },
  { prefix: "/family", roles: ["customer"] },
  { prefix: "/bills", roles: ["customer"] },
  { prefix: "/gifts", roles: ["customer"] },
  { prefix: "/services", roles: ["customer"] },
  { prefix: "/activity", roles: ["customer"] },
  { prefix: "/notifications", roles: ["customer", "vendor", "admin"] },
  { prefix: "/settings", roles: ["customer", "vendor", "admin"] },
]

const AUTH_PAGES = ["/login", "/register"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value)

  if (AUTH_PAGES.some((p) => pathname.startsWith(p))) {
    return session ? NextResponse.redirect(new URL(homeFor(session.role), request.url)) : NextResponse.next()
  }

  const area = AREAS.find((a) => pathname === a.prefix || pathname.startsWith(`${a.prefix}/`))
  if (!area) return NextResponse.next()

  if (!session) {
    const url = new URL("/login", request.url)
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }
  if (!area.roles.includes(session.role)) {
    return NextResponse.redirect(new URL(homeFor(session.role), request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/|favicon|icon|.*\\.(?:svg|png|jpg|ico|webp)$).*)"],
}
