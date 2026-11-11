import "server-only"
import { addDays, startOfDay } from "date-fns"
import { Types } from "mongoose"
import { MAX_CONSECUTIVE_FAILURES, nextOccurrenceAfter, runAtFor, type PlanInterval, type PlanKind } from "../domain/plans"
import { Plan, type PlanDoc } from "../models"
import { formatDate } from "../utils"
import { AppError, notify, parsePaymentSource } from "./core"
import { payBill, placeGiftOrder, requestBooking } from "./orders"

/**
 * Recurring plans: "pay Mom's electricity every month", "a cleaner every two
 * weeks", "flowers on her birthday every year". The first order is placed by
 * the customer as usual; the plan then places the following ones.
 */

type PlanInput = {
  kind: PlanKind
  title: string
  recipientId: string
  interval: PlanInterval
  payWith: string
  /** Date of the order the customer just placed; the plan starts from the next one. */
  firstOccurrence: Date
  bill?: { provider: string; accountNumber: string; amountCents: number }
  gift?: { productId: string; quantity: number; message?: string }
  booking?: { offeringId: string; timeSlot: string; notes?: string }
}

export async function createPlan(customerId: string, input: PlanInput) {
  const active = await Plan.countDocuments({ customer: customerId, status: { $ne: "cancelled" } })
  if (active >= 30) throw new AppError("You can have up to 30 recurring plans.")
  const nextOccurrence = nextOccurrenceAfter(input.firstOccurrence, input.interval)
  return Plan.create({
    customer: customerId,
    kind: input.kind,
    title: input.title,
    recipientId: input.recipientId,
    interval: input.interval,
    payWith: input.payWith,
    nextOccurrence,
    nextRunAt: runAtFor(input.kind, nextOccurrence),
    bill: input.bill,
    gift: input.gift,
    booking: input.booking,
  })
}

export async function setPlanStatus(customerId: string, planId: string, status: "active" | "paused" | "cancelled") {
  const plan = await Plan.findOne({ _id: planId, customer: customerId, status: { $ne: "cancelled" } }).lean<PlanDoc>()
  if (!plan) throw new AppError("Plan not found.")
  const set: Record<string, unknown> = { status }
  if (status === "active") {
    // Resuming skips any occurrences that passed while paused.
    let occurrence = plan.nextOccurrence
    while (runAtFor(plan.kind, occurrence) < new Date()) occurrence = nextOccurrenceAfter(occurrence, plan.interval)
    Object.assign(set, { nextOccurrence: occurrence, nextRunAt: runAtFor(plan.kind, occurrence), consecutiveFailures: 0 })
  }
  await Plan.updateOne({ _id: plan._id }, { $set: set })
}

async function execute(plan: PlanDoc, occurrence: Date) {
  const customerId = plan.customer.toString()
  const opts = { source: parsePaymentSource(plan.payWith), planId: plan._id }
  const recipientId = plan.recipientId.toString()
  // Gifts and bookings need at least a day's notice; if the runner was down, move to tomorrow.
  const earliest = startOfDay(addDays(new Date(), 1))
  const date = plan.kind === "bill" ? occurrence : occurrence < earliest ? earliest : occurrence

  switch (plan.kind) {
    case "bill":
      return payBill(customerId, {
        recipientId,
        provider: plan.bill!.provider as never,
        accountNumber: plan.bill!.accountNumber!,
        amount: plan.bill!.amountCents!,
        period: formatDate(occurrence),
      }, opts)
    case "gift":
      return placeGiftOrder(customerId, {
        recipientId,
        productId: plan.gift!.productId!.toString(),
        quantity: plan.gift!.quantity ?? 1,
        deliveryDate: date,
        message: plan.gift!.message ?? undefined,
      }, opts)
    case "booking":
      return requestBooking(customerId, {
        recipientId,
        offeringId: plan.booking!.offeringId!.toString(),
        date,
        timeSlot: plan.booking!.timeSlot as never,
        notes: plan.booking!.notes ?? undefined,
      }, opts)
  }
}

/**
 * Places every order that is due. Each plan is claimed with an atomic update
 * that also moves it to its next occurrence, so overlapping runs (two cron
 * invocations, an admin clicking twice) never place the same order twice.
 */
export async function runDuePlans(now = new Date(), limit = 100) {
  const summary = { ran: 0, succeeded: 0, failed: 0 }
  for (let i = 0; i < limit; i++) {
    const due = await Plan.findOne({ status: "active", nextRunAt: { $lte: now } }).sort({ nextRunAt: 1 }).lean<PlanDoc>()
    if (!due) break
    const following = nextOccurrenceAfter(due.nextOccurrence, due.interval)
    const claimed = await Plan.findOneAndUpdate(
      { _id: due._id, status: "active", nextRunAt: due.nextRunAt },
      { $set: { nextOccurrence: following, nextRunAt: runAtFor(due.kind, following), lastRunAt: now }, $inc: { runs: 1 } },
    ).lean<PlanDoc>()
    if (!claimed) continue // another runner took it

    summary.ran++
    let error: string | undefined
    let reference: string | undefined
    try {
      const order = await execute(claimed, claimed.nextOccurrence)
      if (order.status === "payment_failed") error = order.events.at(-1)?.note ?? "Payment failed"
      reference = order.reference
    } catch (e) {
      error = e instanceof AppError ? e.message : "Unexpected error"
      if (!(e instanceof AppError)) console.error("[plans] run failed", claimed._id.toString(), e)
    }

    const href = "/plans"
    if (error) {
      summary.failed++
      const failures = claimed.consecutiveFailures + 1
      const pause = failures >= MAX_CONSECUTIVE_FAILURES
      await Plan.updateOne(
        { _id: claimed._id },
        { $set: { consecutiveFailures: failures, lastResult: error, ...(pause ? { status: "paused" } : {}) } },
      )
      await notify(
        claimed.customer,
        pause ? `Plan paused: ${claimed.title}` : `Plan couldn't run: ${claimed.title}`,
        pause ? `It failed ${failures} times in a row (${error}). Fix it and resume the plan.` : `${error}. We'll try again next time.`,
        href,
      )
    } else {
      summary.succeeded++
      await Plan.updateOne({ _id: claimed._id }, { $set: { consecutiveFailures: 0, lastResult: `Placed ${reference}` } })
      await notify(claimed.customer, `Done automatically: ${claimed.title}`, `Your recurring plan placed ${reference}.`, href)
    }
  }
  return summary
}

export async function plansFor(customerId: string) {
  return Plan.find({ customer: new Types.ObjectId(customerId), status: { $ne: "cancelled" } }).sort({ status: 1, nextOccurrence: 1 }).lean<PlanDoc[]>()
}
