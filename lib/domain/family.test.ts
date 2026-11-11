import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { nextBirthday, upcomingOccasions } from "./occasions"
import { LEAD_DAYS, nextOccurrenceAfter, runAtFor } from "./plans"

const day = (iso: string) => new Date(`${iso}T00:00:00`)

describe("occasions", () => {
  it("finds the next birthday this year or next", () => {
    assert.equal(nextBirthday(day("2026-11-10"), 11, 20).toDateString(), day("2026-11-20").toDateString())
    assert.equal(nextBirthday(day("2026-11-10"), 3, 1).toDateString(), day("2027-03-01").toDateString())
    assert.equal(nextBirthday(day("2026-11-10"), 11, 10).toDateString(), day("2026-11-10").toDateString(), "today counts")
  })

  it("moves 29 February birthdays to 28 February in other years", () => {
    assert.equal(nextBirthday(day("2026-01-10"), 2, 29).toDateString(), day("2026-02-28").toDateString())
    assert.equal(nextBirthday(day("2028-01-10"), 2, 29).toDateString(), day("2028-02-29").toDateString())
  })

  it("lists family birthdays and Albanian holidays in date order, within the window", () => {
    const list = upcomingOccasions(day("2026-11-10"), [{ id: "r1", fullName: "Shqipe Krasniqi", birthday: { month: 11, day: 22 } }], 20)
    assert.deepEqual(
      list.map((o) => [o.key, o.inDays]),
      [
        ["birthday-r1", 12],
        ["flag-day", 18],
      ],
    )
    assert.equal(list[0].name, "Shqipe's birthday")
    assert.equal(list[0].recipient?.id, "r1")
  })

  it("marks lunar holidays as approximate", () => {
    const bajram = upcomingOccasions(day("2027-03-01"), [], 15).find((o) => o.key === "bajram-fitr")
    assert.ok(bajram?.approximate)
    assert.equal(bajram?.inDays, 9)
  })

  it("ignores family members without a birthday", () => {
    assert.ok(upcomingOccasions(day("2026-06-01"), [{ id: "x", fullName: "No Date", birthday: null }], 365).every((o) => !o.recipient))
  })
})

describe("recurring plan dates", () => {
  it("steps forward by the interval, keeping month ends sensible", () => {
    assert.equal(nextOccurrenceAfter(day("2026-01-31"), "monthly").toDateString(), day("2026-02-28").toDateString())
    assert.equal(nextOccurrenceAfter(day("2026-11-10"), "biweekly").toDateString(), day("2026-11-24").toDateString())
    assert.equal(nextOccurrenceAfter(day("2026-11-10"), "yearly").toDateString(), day("2027-11-10").toDateString())
  })

  it("places orders ahead of the date so they arrive on time", () => {
    assert.equal(LEAD_DAYS.bill, 0)
    assert.equal(runAtFor("gift", day("2026-12-25")).toDateString(), day("2026-12-22").toDateString())
    assert.equal(runAtFor("booking", day("2026-12-10")).toDateString(), day("2026-12-06").toDateString())
  })
})
