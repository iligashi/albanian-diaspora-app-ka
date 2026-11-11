/**
 * Family features against a real (in-memory) MongoDB: shared wallets, recurring
 * plans, referrals and uploads. Run with `npm run test:integration`.
 */
import { after, before, describe, it } from "node:test"
import assert from "node:assert/strict"
import mongoose from "mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"

process.env.SESSION_SECRET ??= "integration-test-secret-integration-test-secret"
process.env.MONGODB_URI ??= "mongodb://unused"

let M: typeof import("../models")
let orders: typeof import("./orders")
let wallet: typeof import("./wallet")
let plans: typeof import("./plans")
let media: typeof import("./media")
let AppError: typeof import("./core").AppError

let server: MongoMemoryServer
let arben: { id: string; email: string }
let besa: { id: string; email: string }
let mom: string
let familyWallet: string
let floraProduct: string

before(async () => {
  M = await import("../models")
  orders = await import("./orders")
  wallet = await import("./wallet")
  plans = await import("./plans")
  media = await import("./media")
  ;({ AppError } = await import("./core"))
  const { seedDemoData } = await import("../seed")
  server = await MongoMemoryServer.create()
  await mongoose.connect(server.getUri("family-tests"))
  await seedDemoData()
  const a = (await M.User.findOne({ email: "arben@demo.test" }).lean())!
  const b = (await M.User.findOne({ email: "besa@demo.test" }).lean())!
  arben = { id: a._id.toString(), email: a.email }
  besa = { id: b._id.toString(), email: b.email }
  mom = (await M.Recipient.findOne({ owner: a._id, city: "Prishtinë" }).lean())!._id.toString()
  familyWallet = (await M.Wallet.findOne({ kind: "family", owner: a._id }).lean())!._id.toString()
  const flora = (await M.Vendor.findOne({ businessName: "Lulishtja Flora" }).lean())!
  floraProduct = (await M.Product.findOne({ vendor: flora._id }).lean())!._id.toString()
})

after(async () => {
  await mongoose.disconnect()
  await server.stop()
})

const balance = async (id = familyWallet) => (await M.Wallet.findById(id).lean())!.balanceCents
const bill = (amount: number) => ({ recipientId: mom, provider: "kesco" as const, accountNumber: "1029384756", amount })
const tomorrowNoon = () => {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + 2)
  d.setUTCHours(12, 0, 0, 0)
  return d
}

describe("family wallet", () => {
  it("pays an order from the shared wallet and records who paid", async () => {
    const before = await balance()
    const paid = await orders.payBill(arben.id, bill(2000), { source: { type: "wallet", walletId: familyWallet } })
    assert.equal(paid.status, "paid")
    assert.equal(await balance(), before - paid.totalCents)
    const tx = await M.Transaction.findOne({ subjectId: paid._id, type: "charge" }).lean()
    assert.equal(tx?.provider, "wallet")
    const entry = await M.WalletEntry.findOne({ wallet: familyWallet, subjectId: paid._id }).lean()
    assert.equal(entry?.amountCents, -paid.totalCents)
    assert.equal(entry?.user.toString(), arben.id)
  })

  it("lets another member spend from it too", async () => {
    // Besa needs a family member of her own to order for.
    const grandma = await M.Recipient.create({ owner: besa.id, fullName: "Hajrije Krasniqi", relationship: "grandparent", city: "Prishtinë", addressLine: "Rr. Nëna Terezë 3" })
    const before = await balance()
    const paid = await orders.payBill(besa.id, { ...bill(1500), recipientId: grandma._id.toString() }, { source: { type: "wallet", walletId: familyWallet } })
    assert.equal(paid.status, "paid")
    assert.equal(await balance(), before - paid.totalCents)
  })

  it("refunds back into the wallet, not to a card", async () => {
    const order = await orders.placeGiftOrder(arben.id, { productId: floraProduct, quantity: 1, recipientId: mom, deliveryDate: tomorrowNoon() }, { source: { type: "wallet", walletId: familyWallet } })
    const afterPay = await balance()
    await orders.updateGiftOrder({ id: arben.id, role: "customer" }, order._id.toString(), "cancelled")
    assert.equal(await balance(), afterPay + order.totalCents)
    const refund = await M.WalletEntry.findOne({ wallet: familyWallet, type: "refund", subjectId: order._id }).lean()
    assert.equal(refund?.amountCents, order.totalCents)
  })

  it("fails the payment cleanly when the balance is too low", async () => {
    const before = await balance()
    const failed = await orders.payBill(arben.id, bill(400_000), { source: { type: "wallet", walletId: familyWallet } })
    assert.equal(failed.status, "payment_failed")
    assert.equal(await balance(), before, "no money moved")
  })

  it("never goes below zero when siblings pay at the same time", async () => {
    const top = await balance()
    const each = Math.floor(top / 2) + 100 // two of these can't both fit
    const results = await Promise.all([
      orders.payBill(arben.id, bill(each - 99), { source: { type: "wallet", walletId: familyWallet } }),
      orders.payBill(besa.id, { ...bill(each - 99), recipientId: (await M.Recipient.findOne({ owner: besa.id }).lean())!._id.toString() }, { source: { type: "wallet", walletId: familyWallet } }),
    ])
    assert.equal(results.filter((r) => r.status === "paid").length, 1)
    assert.ok((await balance()) >= 0)
  })

  it("rejects people who aren't members", async () => {
    const stranger = await M.User.create({ firstName: "Stranger", lastName: "X", email: "stranger@demo.test", passwordHash: "x", role: "customer" })
    const r = await M.Recipient.create({ owner: stranger._id, fullName: "Someone", relationship: "parent", city: "Prishtinë", addressLine: "Somewhere 1" })
    const failed = await orders.payBill(stranger._id.toString(), { ...bill(1000), recipientId: r._id.toString() }, { source: { type: "wallet", walletId: familyWallet } })
    assert.equal(failed.status, "payment_failed")
    await assert.rejects(wallet.memberWallet(stranger._id.toString(), familyWallet), AppError)
  })

  it("invites by email and adds the person when they accept", async () => {
    const cousin = await M.User.create({ firstName: "Driton", lastName: "K", email: "driton@demo.test", passwordHash: "x", role: "customer" })
    await wallet.inviteToWallet(arben.id, familyWallet, "driton@demo.test")
    await assert.rejects(wallet.inviteToWallet(arben.id, familyWallet, "driton@demo.test"), /already waiting/)
    const [invite] = await wallet.pendingInvitesFor("driton@demo.test")
    await wallet.respondToInvite({ id: cousin._id.toString(), email: cousin.email }, invite._id.toString(), true)
    const w = await M.Wallet.findById(familyWallet).lean()
    assert.ok(w!.members.some((m) => m.user.equals(cousin._id)))
    await assert.rejects(wallet.respondToInvite({ id: cousin._id.toString(), email: cousin.email }, invite._id.toString(), true), /no longer available/)
  })

  it("adds top-ups and reports who contributed what", async () => {
    const before = await balance()
    await wallet.topUp(besa.id, familyWallet, 5000)
    assert.equal(await balance(), before + 5000)
    const totals = await wallet.contributions(new mongoose.Types.ObjectId(familyWallet))
    const besaTotal = totals.find((t) => t._id.toString() === besa.id)
    assert.equal(besaTotal?.toppedUp, 15000) // 100 from the seed + 50 now
  })
})

describe("recurring plans", () => {
  it("places the next order when due, and only once even if two runners overlap", async () => {
    const plan = await plans.createPlan(arben.id, {
      kind: "bill",
      title: "Water for Mom",
      recipientId: mom,
      interval: "monthly",
      payWith: "card",
      firstOccurrence: new Date(),
      bill: { provider: "kru-prishtina", accountNumber: "W-123", amountCents: 1890 },
    })
    // Make it due now.
    await M.Plan.updateOne({ _id: plan._id }, { $set: { nextRunAt: new Date(Date.now() - 1000), nextOccurrence: new Date() } })
    const [a, b] = await Promise.all([plans.runDuePlans(), plans.runDuePlans()])
    assert.equal(a.succeeded + b.succeeded, 1)
    const created = await M.Bill.find({ plan: plan._id }).lean()
    assert.equal(created.length, 1)
    assert.equal(created[0].amountCents, 1890)
    const after = await M.Plan.findById(plan._id).lean()
    assert.ok(after!.nextRunAt > new Date(), "moved to next month")
    assert.equal(after!.runs, 1)
  })

  it("pauses itself after repeated failures and tells the customer", async () => {
    const empty = await wallet.createFamilyWallet(arben.id, "Empty wallet")
    const plan = await plans.createPlan(arben.id, {
      kind: "bill",
      title: "Internet for Mom",
      recipientId: mom,
      interval: "monthly",
      payWith: empty._id.toString(),
      firstOccurrence: new Date(),
      bill: { provider: "ipko", accountNumber: "I-1", amountCents: 2500 },
    })
    for (let i = 0; i < 3; i++) {
      await M.Plan.updateOne({ _id: plan._id }, { $set: { nextRunAt: new Date(Date.now() - 1000) } })
      await plans.runDuePlans()
    }
    const after = await M.Plan.findById(plan._id).lean()
    assert.equal(after!.status, "paused")
    assert.equal(after!.consecutiveFailures, 3)
    assert.ok(await M.Notification.exists({ user: arben.id, title: "Plan paused: Internet for Mom" }))
  })

  it("skips missed dates when resumed", async () => {
    const plan = await M.Plan.findOne({ title: "Internet for Mom" }).lean()
    await M.Plan.updateOne({ _id: plan!._id }, { $set: { nextOccurrence: new Date(Date.now() - 90 * 864e5) } })
    await plans.setPlanStatus(arben.id, plan!._id.toString(), "active")
    const resumed = await M.Plan.findById(plan!._id).lean()
    assert.equal(resumed!.status, "active")
    assert.ok(resumed!.nextRunAt >= new Date(Date.now() - 1000))
  })
})

describe("referrals", () => {
  it("credits both people once, after the new user's first payment", async () => {
    const newbie = await M.User.create({ firstName: "Lirie", lastName: "B", email: "lirie@demo.test", passwordHash: "x", role: "customer", referredBy: arben.id })
    const r = await M.Recipient.create({ owner: newbie._id, fullName: "Nana", relationship: "parent", city: "Prishtinë", addressLine: "X 1" })
    const before = await balance((await wallet.personalWallet(arben.id))._id.toString())
    await orders.payBill(newbie._id.toString(), { ...bill(1000), recipientId: r._id.toString() })
    await orders.payBill(newbie._id.toString(), { ...bill(1000), recipientId: r._id.toString() })
    assert.equal(await balance((await wallet.personalWallet(arben.id))._id.toString()), before + wallet.REFERRAL_BONUS_CENTS)
    assert.equal(await balance((await wallet.personalWallet(newbie._id))._id.toString()), wallet.REFERRAL_BONUS_CENTS)
  })
})

describe("uploads", () => {
  it("accepts real images and voice notes by their bytes, and rejects disguised files", async () => {
    const jpeg = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3])], "a.jpg", { type: "image/jpeg" })
    const webm = new File([new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0, 0])], "v.webm", { type: "audio/webm" })
    const fake = new File([new TextEncoder().encode("<script>alert(1)</script>")], "evil.jpg", { type: "image/jpeg" })
    assert.equal((await media.readUpload(jpeg, "photo"))?.contentType, "image/jpeg")
    assert.equal((await media.readUpload(webm, "voice"))?.contentType, "audio/webm")
    await assert.rejects(media.readUpload(fake, "photo"), AppError)
    await assert.rejects(media.readUpload(jpeg, "voice"), AppError)
  })

  it("lets the vendor add delivery photos that only people on the order can open", async () => {
    const order = await orders.placeGiftOrder(arben.id, { productId: floraProduct, quantity: 1, recipientId: mom, deliveryDate: tomorrowNoon() })
    const flora = (await M.Vendor.findOne({ businessName: "Lulishtja Flora" }).lean())!
    const vendorUser = { id: flora.user.toString(), role: "vendor" as const }
    const photo = (await media.readUpload(new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0])], "p.png"), "photo"))!
    await assert.rejects(media.addProof(vendorUser, "gift", order._id.toString(), photo), /accepted/)
    await orders.updateGiftOrder(vendorUser, order._id.toString(), "accepted")
    const saved = await media.addProof(vendorUser, "gift", order._id.toString(), photo)

    assert.ok(await media.openMedia({ id: arben.id, role: "customer" }, saved._id.toString()))
    assert.ok(await media.openMedia(vendorUser, saved._id.toString()))
    assert.equal(await media.openMedia({ id: besa.id, role: "customer" }, saved._id.toString()), null)
    const other = (await M.Vendor.findOne({ businessName: "Ëmbëlsira Dukagjini" }).lean())!
    assert.equal(await media.openMedia({ id: other.user.toString(), role: "vendor" }, saved._id.toString()), null)
  })
})
