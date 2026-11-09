import { jwtVerify, SignJWT } from "jose"
import type { Role } from "../models"

/**
 * Session token helpers. Edge-safe (no Node APIs) so middleware can use them.
 */

export const SESSION_COOKIE = "dc_session"
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

export type SessionPayload = {
  sub: string
  role: Role
  name: string
}

function secretKey() {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must be set to at least 32 characters.")
  return new TextEncoder().encode(secret)
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT({ role: payload.role, name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secretKey())
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] })
    if (!payload.sub || typeof payload.role !== "string") return null
    return { sub: payload.sub, role: payload.role as Role, name: String(payload.name ?? "") }
  } catch {
    return null
  }
}

export function homeFor(role: Role) {
  if (role === "admin") return "/admin"
  if (role === "vendor") return "/vendor"
  return "/dashboard"
}
