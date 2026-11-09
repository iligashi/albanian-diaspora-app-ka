"use server"

import { revalidatePath } from "next/cache"
import { parseForm, runAction, type ActionState } from "@/lib/actions"
import { hashPassword, verifyPassword } from "@/lib/auth/password"
import { requireUser } from "@/lib/auth/session"
import { Notification, User } from "@/lib/models"
import { AppError } from "@/lib/services/core"
import { changePasswordSchema, profileSchema } from "@/lib/validation"

export async function updateProfileAction(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await requireUser()
    const input = parseForm(profileSchema, formData)
    await User.updateOne({ _id: user.id }, { $set: input })
    revalidatePath("/", "layout")
    return { ok: true, message: "Profile updated" }
  })
}

export async function changePasswordAction(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await requireUser()
    const input = parseForm(changePasswordSchema, formData)
    const record = await User.findById(user.id).select("+passwordHash")
    if (!record || !(await verifyPassword(input.currentPassword, record.passwordHash))) {
      throw new AppError("Your current password is incorrect.")
    }
    record.passwordHash = await hashPassword(input.newPassword)
    await record.save()
    return { ok: true, message: "Password changed" }
  })
}

export async function markAllNotificationsReadAction(): Promise<ActionState> {
  return runAction(async () => {
    const user = await requireUser()
    await Notification.updateMany({ user: user.id, readAt: null }, { $set: { readAt: new Date() } })
    revalidatePath("/", "layout")
  })
}
