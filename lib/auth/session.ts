import "server-only"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"
import { connectDB } from "../db"
import { env } from "../env"
import { User, type Role } from "../models"
import { homeFor, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, signSession, verifySession } from "./token"

export async function createSession(user: { _id: { toString(): string }; role: Role; firstName: string; lastName: string }) {
  const token = await signSession({ sub: user._id.toString(), role: user.role, name: `${user.firstName} ${user.lastName}` })
  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env().NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
}

export async function destroySession() {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
}

export const getSession = cache(async () => {
  const jar = await cookies()
  return verifySession(jar.get(SESSION_COOKIE)?.value)
})

export type CurrentUser = {
  id: string
  role: Role
  firstName: string
  lastName: string
  email: string
}

/** The signed-in user, re-read from the database once per request so disabled accounts lose access immediately. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession()
  if (!session) return null
  await connectDB()
  const user = await User.findById(session.sub).lean()
  if (!user || user.status !== "active") return null
  return {
    id: user._id.toString(),
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  }
})

/** Use at the top of every protected page and server action. */
export async function requireUser(...roles: Role[]) {
  const user = await getCurrentUser()
  if (!user) redirect((await getSession()) ? "/signout" : "/login")
  if (roles.length > 0 && !roles.includes(user.role)) redirect(homeFor(user.role))
  return user
}
