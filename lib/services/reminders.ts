import "server-only"
import { subDays } from "date-fns"
import { upcomingOccasions } from "../domain/occasions"
import { Notification, Recipient } from "../models"
import { notify } from "./core"

const REMIND_DAYS_BEFORE = 5

/**
 * Tells customers a few days before a family member's birthday, early enough
 * for a shop to deliver. Safe to run many times a day: each reminder is sent once.
 */
export async function sendBirthdayReminders(now = new Date()) {
  const recipients = await Recipient.find({ "birthday.month": { $exists: true } }).select("owner fullName birthday").lean()
  let sent = 0
  for (const r of recipients) {
    const [occasion] = upcomingOccasions(now, [{ id: r._id.toString(), fullName: r.fullName, birthday: r.birthday }], REMIND_DAYS_BEFORE).filter((o) => o.recipient)
    if (!occasion) continue
    const title = `${occasion.name} in ${occasion.inDays === 0 ? "today" : `${occasion.inDays} day${occasion.inDays === 1 ? "" : "s"}`}`
    const href = `/gifts?for=${r._id}&category=${occasion.suggest}`
    if (await Notification.exists({ user: r.owner, href, createdAt: { $gte: subDays(now, 20) } })) continue
    await notify(r.owner, title, `Send ${r.fullName.split(" ")[0]} something from a local shop. Order now so it arrives on the day.`, href)
    sent++
  }
  return sent
}
