import "server-only"
import { Recipient } from "./models"

export type RecipientOption = { id: string; fullName: string; city: string; addressLine: string }

export async function recipientOptions(customerId: string): Promise<RecipientOption[]> {
  const recipients = await Recipient.find({ owner: customerId }).sort({ fullName: 1 }).lean()
  return recipients.map((r) => ({ id: r._id.toString(), fullName: r.fullName, city: r.city, addressLine: r.addressLine }))
}
