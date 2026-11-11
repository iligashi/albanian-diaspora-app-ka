"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { formatMoney } from "@/lib/money"
import { parseForm, runAction, type ActionState } from "@/lib/actions"
import { requireUser } from "@/lib/auth/session"
import { createFamilyWallet, inviteToWallet, leaveWallet, respondToInvite, topUp } from "@/lib/services/wallet"
import { idSchema, topUpSchema, walletInviteSchema, walletNameSchema } from "@/lib/validation"

export async function createWalletAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let id = ""
  const result = await runAction(async () => {
    const user = await requireUser("customer")
    const wallet = await createFamilyWallet(user.id, parseForm(walletNameSchema, formData).name)
    id = wallet._id.toString()
  })
  if (result.ok) redirect(`/wallet/${id}?new=1`)
  return result
}

export async function topUpAction(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await requireUser("customer")
    const input = parseForm(topUpSchema, formData)
    await topUp(user.id, input.walletId, input.amount)
    revalidatePath("/wallet", "layout")
    return { ok: true, message: `${formatMoney(input.amount)} added` }
  })
}

export async function inviteAction(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await requireUser("customer")
    const input = parseForm(walletInviteSchema, formData)
    if (input.email === user.email) return { error: "That's your own email." }
    await inviteToWallet(user.id, input.walletId, input.email)
    revalidatePath(`/wallet/${input.walletId}`)
    return { ok: true, message: `Invitation sent to ${input.email}` }
  })
}

export async function respondToInviteAction(inviteId: string, accept: boolean): Promise<ActionState> {
  return runAction(async () => {
    const user = await requireUser("customer")
    await respondToInvite({ id: user.id, email: user.email }, idSchema.parse(inviteId), accept)
    revalidatePath("/wallet", "layout")
    return { ok: true, message: accept ? "You joined the wallet" : "Invitation declined" }
  })
}

export async function leaveWalletAction(walletId: string): Promise<ActionState> {
  const result = await runAction(async () => {
    const user = await requireUser("customer")
    await leaveWallet(user.id, idSchema.parse(walletId))
  })
  if (result.ok) redirect("/wallet")
  return result
}
