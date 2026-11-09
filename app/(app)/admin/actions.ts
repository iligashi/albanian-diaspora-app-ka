"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { parseForm, runAction, type ActionState } from "@/lib/actions"
import { requireUser } from "@/lib/auth/session"
import { refundBill, setUserStatus, setVendorStatus, settleBill } from "@/lib/services/admin"
import { idSchema, settleBillSchema } from "@/lib/validation"

export async function settleBillAction(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    await requireUser("admin")
    const input = parseForm(settleBillSchema, formData)
    await settleBill(input.billId, input.settlementReference)
    revalidatePath("/admin", "layout")
    return { ok: true, message: "Bill marked as settled. The customer has been notified." }
  })
}

const reason = z.string().trim().min(3, "Give a short reason").max(300)

export async function refundBillAction(billId: string, _to: string, note?: string): Promise<ActionState> {
  return runAction(async () => {
    await requireUser("admin")
    await refundBill(idSchema.parse(billId), reason.parse(note ?? ""))
    revalidatePath("/admin", "layout")
    return { ok: true, message: "Bill refunded." }
  })
}

export async function setVendorStatusAction(vendorId: string, status: "approved" | "suspended", note?: string): Promise<ActionState> {
  return runAction(async () => {
    await requireUser("admin")
    await setVendorStatus(idSchema.parse(vendorId), z.enum(["approved", "suspended"]).parse(status), z.string().max(300).optional().parse(note))
    revalidatePath("/admin/vendors")
    return { ok: true, message: status === "approved" ? "Vendor approved and notified." : "Vendor suspended." }
  })
}

export async function setUserStatusAction(userId: string, status: "active" | "disabled"): Promise<ActionState> {
  return runAction(async () => {
    const admin = await requireUser("admin")
    await setUserStatus(admin.id, idSchema.parse(userId), z.enum(["active", "disabled"]).parse(status))
    revalidatePath("/admin/users")
    return { ok: true, message: status === "active" ? "Account re-enabled." : "Account disabled. They've been signed out." }
  })
}
