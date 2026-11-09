import "server-only"
import { getBillProvider } from "../domain/catalog"
import { billMachine } from "../domain/workflow"
import { Bill, User, Vendor, type BillDoc } from "../models"
import { AppError, notify, refund, transition } from "./core"

export async function settleBill(billId: string, settlementReference: string) {
  const bill = await Bill.findById(billId).lean<BillDoc>()
  if (!bill) throw new AppError("Bill not found.")
  await transition({
    model: Bill,
    machine: billMachine,
    doc: bill,
    to: "settled",
    actor: "admin",
    note: settlementReference,
    set: { settlementReference, settledAt: new Date() },
  })
  const provider = getBillProvider(bill.provider)?.name ?? bill.provider
  await notify(bill.customer, `Bill ${bill.reference} paid`, `${provider} confirmed the payment. Receipt: ${settlementReference}.`, `/bills/${bill._id}`)
}

export async function refundBill(billId: string, reason: string) {
  const bill = await Bill.findById(billId).lean<BillDoc>()
  if (!bill) throw new AppError("Bill not found.")
  await transition({ model: Bill, machine: billMachine, doc: bill, to: "refunded", actor: "admin", note: reason })
  await refund("bill", bill._id)
  await notify(bill.customer, `Bill ${bill.reference} refunded`, `We couldn't pay this bill: ${reason}. You've been refunded in full.`, `/bills/${bill._id}`)
}

export async function setVendorStatus(vendorId: string, status: "approved" | "suspended", note?: string) {
  const vendor = await Vendor.findByIdAndUpdate(
    vendorId,
    { $set: { status, reviewNote: note, ...(status === "approved" ? { approvedAt: new Date() } : {}) } },
    { new: true },
  )
  if (!vendor) throw new AppError("Vendor not found.")
  await notify(
    vendor.user,
    status === "approved" ? "Your business is live" : "Your business was suspended",
    status === "approved" ? "Families can now find and order from you." : note || "Contact support for details.",
    "/vendor",
  )
}

export async function setUserStatus(adminId: string, userId: string, status: "active" | "disabled") {
  if (adminId === userId) throw new AppError("You can't disable your own account.")
  const res = await User.updateOne({ _id: userId }, { $set: { status } })
  if (res.matchedCount === 0) throw new AppError("User not found.")
}
