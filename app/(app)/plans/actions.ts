"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { runAction, type ActionState } from "@/lib/actions"
import { requireUser } from "@/lib/auth/session"
import { setPlanStatus } from "@/lib/services/plans"
import { idSchema } from "@/lib/validation"

const MESSAGES = { active: "Plan resumed", paused: "Plan paused", cancelled: "Plan cancelled" } as const

export async function setPlanStatusAction(planId: string, status: string): Promise<ActionState> {
  return runAction(async () => {
    const user = await requireUser("customer")
    const to = z.enum(["active", "paused", "cancelled"]).parse(status)
    await setPlanStatus(user.id, idSchema.parse(planId), to)
    revalidatePath("/plans")
    return { ok: true, message: MESSAGES[to] }
  })
}
