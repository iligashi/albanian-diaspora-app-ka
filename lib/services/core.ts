import "server-only"
import type { Model, Types } from "mongoose"
import { assertTransition, type Actor } from "../domain/workflow"
import { Notification, Transaction, type SubjectKind } from "../models"
import { paymentProvider } from "../payments"

/** An error whose message is safe to show to the user. */
export class AppError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AppError"
  }
}

export async function notify(userId: Types.ObjectId | string, title: string, body: string, href?: string) {
  await Notification.create({ user: userId, title, body, href })
}

type Subject = { kind: SubjectKind; id: Types.ObjectId; reference: string; description: string; customer: Types.ObjectId }

/** How the customer pays: their card (through the payment provider) or a wallet they belong to. */
export type PaymentSource = { type: "card" } | { type: "wallet"; walletId: string }

export function parsePaymentSource(value: string | undefined): PaymentSource {
  if (!value || value === "card") return { type: "card" }
  if (!/^[a-f\d]{24}$/i.test(value)) throw new AppError("Choose how you want to pay.")
  return { type: "wallet", walletId: value }
}

/** Charges the customer and records the attempt in the ledger, whatever the outcome. */
export async function charge(subject: Subject, amountCents: number, source: PaymentSource = { type: "card" }) {
  const { debitWallet, rewardReferral } = await import("./wallet")
  let provider: string
  let result: { ok: true; providerReference: string } | { ok: false; reason: string }
  if (source.type === "wallet") {
    provider = "wallet"
    result = await debitWallet(source.walletId, subject.customer, amountCents, { kind: subject.kind, id: subject.id, description: subject.description })
  } else {
    const card = paymentProvider()
    provider = card.name
    result = await card.charge({ amountCents, description: subject.description, reference: subject.reference, customerId: subject.customer.toString() })
  }
  await Transaction.create({
    customer: subject.customer,
    subjectKind: subject.kind,
    subjectId: subject.id,
    subjectReference: subject.reference,
    description: subject.description,
    type: "charge",
    amountCents,
    provider,
    providerReference: result.ok ? result.providerReference : undefined,
    wallet: source.type === "wallet" ? source.walletId : undefined,
    status: result.ok ? "succeeded" : "failed",
    failureReason: result.ok ? undefined : result.reason,
  })
  if (result.ok) await rewardReferral(subject.customer)
  return result
}

/**
 * Refunds the successful charge for a subject back to where it came from (card
 * or wallet). Safe to call twice: it refuses to refund more than was charged.
 */
export async function refund(kind: SubjectKind, id: Types.ObjectId) {
  const charges = await Transaction.find({ subjectKind: kind, subjectId: id, status: "succeeded" }).lean()
  const original = charges.find((t) => t.type === "charge")
  if (!original) return
  const alreadyRefunded = charges.filter((t) => t.type === "refund").reduce((sum, t) => sum + t.amountCents, 0)
  const amount = original.amountCents - alreadyRefunded
  if (amount <= 0) return

  let result: { ok: true; providerReference: string } | { ok: false; reason: string }
  if (original.provider === "wallet" && original.wallet) {
    const { creditWallet } = await import("./wallet")
    result = await creditWallet(original.wallet, original.customer, amount, "refund", `Refund: ${original.description}`, { kind, id, description: original.description })
  } else {
    result = await paymentProvider().refund({ providerReference: original.providerReference!, amountCents: amount })
  }
  await Transaction.create({
    customer: original.customer,
    subjectKind: kind,
    subjectId: id,
    subjectReference: original.subjectReference,
    description: `Refund: ${original.description}`,
    type: "refund",
    amountCents: amount,
    provider: original.provider,
    wallet: original.wallet,
    providerReference: result.ok ? result.providerReference : undefined,
    status: result.ok ? "succeeded" : "failed",
    failureReason: result.ok ? undefined : result.reason,
  })
  if (!result.ok) throw new AppError("The refund could not be processed. Please contact support.")
}

type Machine<S extends string> = Parameters<typeof assertTransition<S>>[0]

type StatusDoc<S extends string> = { _id: Types.ObjectId; status: S }

/**
 * Moves an order to a new status atomically.
 *
 * The update only matches if the document is still in the status we validated
 * against, so two people clicking at once can't both succeed (no double refunds,
 * no "delivered" order being cancelled).
 */
export async function transition<S extends string, D extends StatusDoc<S>>(opts: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: Model<any>
  machine: Machine<S>
  doc: D
  to: S
  actor: Actor
  note?: string
  set?: Record<string, unknown>
}) {
  const { model, machine, doc, to, actor, note, set } = opts
  const rule = assertTransition(machine, doc.status, to, actor)
  const updated = await model
    .findOneAndUpdate(
      { _id: doc._id, status: doc.status } as never,
      { $set: { status: to, ...set }, $push: { events: { status: to, actor, note, at: new Date() } } } as never,
      { new: true },
    )
    .lean<D>()
  if (!updated) throw new AppError("This item was just updated by someone else. Refresh and try again.")
  return { updated, refunds: Boolean(rule.refunds) }
}
