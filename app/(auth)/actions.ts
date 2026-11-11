"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { parseForm, runAction, type ActionState } from "@/lib/actions"
import { hashPassword, verifyAgainstDummy, verifyPassword } from "@/lib/auth/password"
import { safeRedirectPath } from "@/lib/auth/redirect"
import { createSession, destroySession } from "@/lib/auth/session"
import { homeFor } from "@/lib/auth/token"
import { User } from "@/lib/models"
import { rateLimit } from "@/lib/rate-limit"
import { AppError } from "@/lib/services/core"
import { loginSchema, registerSchema } from "@/lib/validation"

async function clientIp() {
  const h = await headers()
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local"
}

export async function login(_: ActionState, formData: FormData): Promise<ActionState> {
  let destination = "/"
  const result = await runAction(async () => {
    const input = parseForm(loginSchema, formData)
    const ip = await clientIp()
    const limit = rateLimit(`login:${ip}:${input.email}`, 8, 15 * 60 * 1000)
    if (!limit.ok) throw new AppError(`Too many attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`)

    const user = await User.findOne({ email: input.email }).select("+passwordHash")
    const valid = user ? await verifyPassword(input.password, user.passwordHash) : await verifyAgainstDummy(input.password)
    if (!user || !valid) throw new AppError("That email and password don't match.")
    if (user.status !== "active") throw new AppError("This account has been disabled. Contact support.")

    user.lastLoginAt = new Date()
    await user.save()
    await createSession(user)
    destination = safeRedirectPath(formData.get("next")) ?? homeFor(user.role)
  })
  if (result.ok) redirect(destination)
  return { ...result, values: { email: String(formData.get("email") ?? "") } }
}

export async function register(_: ActionState, formData: FormData): Promise<ActionState> {
  let destination = "/"
  const result = await runAction(async () => {
    const input = parseForm(registerSchema, formData)
    const limit = rateLimit(`register:${await clientIp()}`, 5, 60 * 60 * 1000)
    if (!limit.ok) throw new AppError("Too many sign-ups from this network. Try again later.")

    if (await User.exists({ email: input.email })) {
      throw new AppError("An account with this email already exists. Try signing in.")
    }
    // An invite code from a friend; both get wallet credit after the first payment.
    const referrer =
      input.ref && input.accountType === "customer"
        ? await User.findOne({ referralCode: input.ref.toUpperCase(), role: "customer", status: "active" }).select("_id").lean()
        : null
    const user = await User.create({
      referredBy: referrer?._id,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      country: input.country,
      role: input.accountType,
      passwordHash: await hashPassword(input.password),
    })
    await createSession(user)
    // Vendors go straight to business setup; their account stays pending until approved.
    destination = input.accountType === "vendor" ? "/vendor/profile" : "/family?welcome=1"
  })
  if (result.ok) redirect(destination)
  return result
}

export async function logout() {
  await destroySession()
  redirect("/login")
}
