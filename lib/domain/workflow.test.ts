import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  assertTransition,
  availableActions,
  billMachine,
  bookingMachine,
  giftMachine,
  isTerminal,
  TransitionError,
} from "./workflow"

describe("gift order workflow", () => {
  it("lets the vendor walk an order from placed to delivered", () => {
    assertTransition(giftMachine, "placed", "accepted", "vendor")
    assertTransition(giftMachine, "accepted", "out_for_delivery", "vendor")
    assertTransition(giftMachine, "out_for_delivery", "delivered", "vendor")
  })

  it("refunds when a vendor rejects or a customer cancels", () => {
    assert.equal(assertTransition(giftMachine, "placed", "rejected", "vendor").refunds, true)
    assert.equal(assertTransition(giftMachine, "placed", "cancelled", "customer").refunds, true)
  })

  it("stops customers from cancelling once the vendor has accepted", () => {
    assert.throws(() => assertTransition(giftMachine, "accepted", "cancelled", "customer"), TransitionError)
  })

  it("stops customers from marking their own order delivered", () => {
    assert.throws(() => assertTransition(giftMachine, "out_for_delivery", "delivered", "customer"), TransitionError)
  })

  it("only the system can confirm payment", () => {
    assert.throws(() => assertTransition(giftMachine, "awaiting_payment", "placed", "customer"), TransitionError)
    assertTransition(giftMachine, "awaiting_payment", "placed", "system")
  })
})

describe("booking workflow", () => {
  it("offers the vendor confirm and decline on a new request", () => {
    const labels = availableActions(bookingMachine, "requested", "vendor").map((a) => a.to)
    assert.deepEqual(labels, ["confirmed", "declined"])
  })

  it("lets the customer cancel until work starts", () => {
    assertTransition(bookingMachine, "requested", "cancelled", "customer")
    assertTransition(bookingMachine, "confirmed", "cancelled", "customer")
    assert.throws(() => assertTransition(bookingMachine, "in_progress", "cancelled", "customer"), TransitionError)
  })

  it("treats completed, declined and cancelled as final", () => {
    for (const s of ["completed", "declined", "cancelled"] as const) {
      assert.equal(isTerminal(bookingMachine, s), true)
      assert.equal(availableActions(bookingMachine, s, "vendor").length, 0)
    }
  })
})

describe("bill workflow", () => {
  it("only admins settle or refund a paid bill", () => {
    assertTransition(billMachine, "paid", "settled", "admin")
    assert.throws(() => assertTransition(billMachine, "paid", "settled", "customer"), TransitionError)
    assert.throws(() => assertTransition(billMachine, "paid", "settled", "vendor"), TransitionError)
  })

  it("never moves a settled bill again", () => {
    assert.equal(availableActions(billMachine, "settled", "admin").length, 0)
  })
})
