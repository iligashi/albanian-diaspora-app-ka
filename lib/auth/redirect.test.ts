import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { safeRedirectPath } from "./redirect"

describe("safeRedirectPath", () => {
  it("keeps paths on this site", () => {
    assert.equal(safeRedirectPath("/bills/new"), "/bills/new")
    assert.equal(safeRedirectPath("/gifts?for=abc#top"), "/gifts?for=abc#top")
  })

  it("rejects anything that leaves the site", () => {
    const attempts: unknown[] = [
      "https://evil.com",
      "//evil.com",
      "/\\evil.com",
      "/\\/evil.com",
      "/\tevil.com",
      "/\nevil.com",
      "evil.com",
      "",
      null,
      42,
    ]
    for (const bad of attempts) {
      assert.equal(safeRedirectPath(bad), null, JSON.stringify(bad))
    }
  })
})
