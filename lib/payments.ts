import "server-only"
import { randomUUID } from "node:crypto"
import { env } from "./env"

/**
 * Payment provider boundary. The rest of the app only talks to this interface,
 * so adding Stripe means writing one more implementation (plus a webhook that
 * confirms asynchronous charges); no order code changes.
 */
export type ChargeResult = { ok: true; providerReference: string } | { ok: false; reason: string }

export interface PaymentProvider {
  readonly name: string
  readonly isTest: boolean
  charge(input: { amountCents: number; description: string; reference: string; customerId: string }): Promise<ChargeResult>
  refund(input: { providerReference: string; amountCents: number }): Promise<ChargeResult>
}

/** Approves every charge instantly. No money moves. Clearly labelled as test mode in the UI. */
const testProvider: PaymentProvider = {
  name: "test",
  isTest: true,
  async charge() {
    return { ok: true, providerReference: `test_ch_${randomUUID().slice(0, 12)}` }
  },
  async refund() {
    return { ok: true, providerReference: `test_re_${randomUUID().slice(0, 12)}` }
  },
}

export function paymentProvider(): PaymentProvider {
  switch (env().PAYMENT_PROVIDER) {
    case "test":
      return testProvider
  }
}
