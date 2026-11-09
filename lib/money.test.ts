import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { parseMoneyToCents, serviceFeeCents } from "./money"

describe("parseMoneyToCents", () => {
  it("parses whole and decimal amounts, with dot or comma", () => {
    assert.equal(parseMoneyToCents("12"), 1200)
    assert.equal(parseMoneyToCents("12.5"), 1250)
    assert.equal(parseMoneyToCents("12,05"), 1205)
    assert.equal(parseMoneyToCents(" 0.99 "), 99)
  })

  it("rejects malformed input instead of guessing", () => {
    for (const bad of ["", "abc", "-5", "1.234", "1e3", "12.", "."]) {
      assert.equal(parseMoneyToCents(bad), null, bad)
    }
  })
})

describe("serviceFeeCents", () => {
  it("applies the minimum, percentage and cap", () => {
    assert.equal(serviceFeeCents(1000), 99)
    assert.equal(serviceFeeCents(10_000), 250)
    assert.equal(serviceFeeCents(1_000_000), 999)
  })
})
