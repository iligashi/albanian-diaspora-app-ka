import { addDays } from "date-fns"
import { hashPassword } from "./auth/password"
import { serviceFeeCents } from "./money"
import { Bill, Booking, GiftOrder, Offering, Product, Recipient, Transaction, User, Vendor } from "./models"
import { makeReference } from "./utils"

/** Password shared by every demo account. Demo data is only ever created on local/dev databases. */
export const DEMO_PASSWORD = "demo-pass-2026"

export const DEMO_ACCOUNTS = {
  admin: "admin@demo.test",
  customer: "arben@demo.test",
  giftVendor: "flora@demo.test",
  serviceVendor: "pastrim@demo.test",
} as const

export async function ensureAdmin(email: string, password: string) {
  const existing = await User.findOne({ email: email.toLowerCase() })
  if (existing) return existing
  return User.create({
    firstName: "Platform",
    lastName: "Admin",
    email,
    passwordHash: await hashPassword(password),
    role: "admin",
  })
}

/** Creates a realistic demo dataset. Idempotent: does nothing if the demo customer already exists. */
export async function seedDemoData() {
  if (await User.exists({ email: DEMO_ACCOUNTS.customer })) return false

  const passwordHash = await hashPassword(DEMO_PASSWORD)
  const person = (firstName: string, lastName: string, email: string, role: "customer" | "vendor" | "admin", country?: string) =>
    User.create({ firstName, lastName, email, passwordHash, role, country })

  await person("Platform", "Admin", DEMO_ACCOUNTS.admin, "admin")
  const arben = await person("Arben", "Krasniqi", DEMO_ACCOUNTS.customer, "customer", "Germany")

  const mother = await Recipient.create({
    owner: arben._id,
    fullName: "Shqipe Krasniqi",
    relationship: "parent",
    phone: "+383 44 123 456",
    city: "Prishtinë",
    addressLine: "Rr. Agim Ramadani 14, Lagjja Ulpiana",
  })
  const grandpa = await Recipient.create({
    owner: arben._id,
    fullName: "Bajram Krasniqi",
    relationship: "grandparent",
    phone: "+383 49 987 654",
    city: "Drenas",
    addressLine: "Fshati Korroticë e Epërme, nr. 22",
    notes: "Hard of hearing — call his neighbour Fatmir first.",
  })

  const vendorAccount = async (
    user: [string, string, string],
    profile: { businessName: string; kind: "gifts" | "services"; city: (typeof mother)["city"]; description: string; phone: string; serviceCities: string[]; status?: "approved" | "pending" },
  ) => {
    const u = await person(user[0], user[1], user[2], "vendor")
    return Vendor.create({
      user: u._id,
      ...profile,
      status: profile.status ?? "approved",
      approvedAt: profile.status === "pending" ? undefined : new Date(),
    })
  }

  const flora = await vendorAccount(["Drita", "Berisha", DEMO_ACCOUNTS.giftVendor], {
    businessName: "Lulishtja Flora",
    kind: "gifts",
    city: "Prishtinë",
    description: "Fresh bouquets and arrangements, hand-delivered across Prishtinë and nearby towns the same day.",
    phone: "+383 44 555 101",
    serviceCities: ["Prishtinë", "Fushë Kosovë", "Lipjan", "Drenas", "Podujevë"],
  })
  const dukagjini = await vendorAccount(["Besnik", "Gashi", "dukagjini@demo.test"], {
    businessName: "Ëmbëlsira Dukagjini",
    kind: "gifts",
    city: "Pejë",
    description: "Traditional cakes, baklava and festive sweet boxes baked to order.",
    phone: "+383 45 222 303",
    serviceCities: ["Pejë", "Gjakovë", "Deçan", "Istog", "Klinë", "Prishtinë"],
  })
  const pastrim = await vendorAccount(["Valon", "Hoxha", DEMO_ACCOUNTS.serviceVendor], {
    businessName: "Pastrim Pro",
    kind: "services",
    city: "Prishtinë",
    description: "Insured home cleaning team. Deep cleans, move-in/move-out and regular visits for elderly relatives.",
    phone: "+383 49 777 808",
    serviceCities: ["Prishtinë", "Fushë Kosovë", "Drenas", "Lipjan"],
  })
  const elektro = await vendorAccount(["Agron", "Morina", "elektro@demo.test"], {
    businessName: "Elektro Servis Morina",
    kind: "services",
    city: "Prizren",
    description: "Licensed electricians and plumbers for repairs, installations and emergency call-outs.",
    phone: "+383 44 909 404",
    serviceCities: ["Prizren", "Suharekë", "Rahovec", "Dragash", "Prishtinë", "Drenas"],
  })
  await vendorAccount(["Teuta", "Shala", "kujdes@demo.test"], {
    businessName: "Kujdesi në Shtëpi",
    kind: "services",
    city: "Gjilan",
    description: "Companionship and daily help for elderly parents: shopping, pharmacy runs, doctor visits.",
    phone: "+383 45 333 606",
    serviceCities: ["Gjilan", "Kamenicë", "Viti"],
    status: "pending",
  })

  const products = await Product.insertMany([
    { vendor: flora._id, name: "Seasonal bouquet", category: "flowers", priceCents: 3500, description: "Hand-tied bouquet of the freshest seasonal flowers." },
    { vendor: flora._id, name: "Red roses (20 stems)", category: "flowers", priceCents: 5500, description: "Twenty long-stem red roses, wrapped." },
    { vendor: flora._id, name: "Orchid in ceramic pot", category: "flowers", priceCents: 4200, description: "White phalaenopsis orchid that lasts for months." },
    { vendor: dukagjini._id, name: "Baklava tray (1 kg)", category: "sweets", priceCents: 2800, description: "Walnut baklava made the traditional way." },
    { vendor: dukagjini._id, name: "Birthday cake", category: "cakes", priceCents: 3900, description: "Chocolate or vanilla, serves 10. Add the name in the gift message." },
    { vendor: dukagjini._id, name: "Festive basket", category: "food_baskets", priceCents: 6500, description: "Coffee, Turkish delight, dried fruit, honey and local cheese." },
  ])
  const offerings = await Offering.insertMany([
    { vendor: pastrim._id, title: "Standard home clean (3 hours)", category: "cleaning", priceCents: 4500, durationMinutes: 180, description: "Kitchen, bathroom, floors and dusting for an apartment up to 90 m²." },
    { vendor: pastrim._id, title: "Deep clean", category: "cleaning", priceCents: 9000, durationMinutes: 360, description: "Inside cupboards, oven, windows and balcony." },
    { vendor: elektro._id, title: "Electrician visit", category: "electrical", priceCents: 3000, durationMinutes: 60, description: "Diagnosis and small repairs. Parts billed separately on site." },
    { vendor: elektro._id, title: "Plumbing repair", category: "plumbing", priceCents: 3500, durationMinutes: 60, description: "Leaks, taps, boilers and blocked drains." },
  ])

  const snapshot = (r: typeof mother) => ({
    recipientId: r._id,
    fullName: r.fullName,
    phone: r.phone ?? undefined,
    city: r.city,
    addressLine: r.addressLine,
  })
  const now = new Date()

  const billAmount = 4870
  const bill = await Bill.create({
    reference: makeReference("BL"),
    customer: arben._id,
    recipient: snapshot(mother),
    provider: "kesco",
    accountNumber: "1029384756",
    period: "October 2026",
    amountCents: billAmount,
    feeCents: serviceFeeCents(billAmount),
    totalCents: billAmount + serviceFeeCents(billAmount),
    status: "settled",
    settlementReference: "KESCO-88123401",
    settledAt: addDays(now, -6),
    events: [
      { status: "awaiting_payment", actor: "customer", at: addDays(now, -7) },
      { status: "paid", actor: "system", at: addDays(now, -7) },
      { status: "settled", actor: "admin", note: "KESCO-88123401", at: addDays(now, -6) },
    ],
  })

  const bouquet = products[0]
  const giftSubtotal = bouquet.priceCents
  const gift = await GiftOrder.create({
    reference: makeReference("GF"),
    customer: arben._id,
    vendor: flora._id,
    recipient: snapshot(mother),
    items: [{ product: bouquet._id, name: bouquet.name, unitPriceCents: bouquet.priceCents, quantity: 1 }],
    subtotalCents: giftSubtotal,
    feeCents: serviceFeeCents(giftSubtotal),
    totalCents: giftSubtotal + serviceFeeCents(giftSubtotal),
    message: "Gëzuar ditëlindjen, nënë! Të duam shumë. — Arbeni",
    deliveryDate: addDays(now, 2),
    status: "placed",
    events: [
      { status: "awaiting_payment", actor: "customer", at: addDays(now, -1) },
      { status: "placed", actor: "system", at: addDays(now, -1) },
    ],
  })

  const clean = offerings[0]
  const booking = await Booking.create({
    reference: makeReference("BK"),
    customer: arben._id,
    vendor: pastrim._id,
    offering: clean._id,
    offeringTitle: clean.title,
    category: clean.category,
    recipient: snapshot(grandpa),
    date: addDays(now, 4),
    timeSlot: "10:00–12:00",
    notes: "Please bring your own cleaning supplies.",
    priceCents: clean.priceCents,
    feeCents: serviceFeeCents(clean.priceCents),
    totalCents: clean.priceCents + serviceFeeCents(clean.priceCents),
    status: "requested",
    events: [
      { status: "awaiting_payment", actor: "customer", at: now },
      { status: "requested", actor: "system", at: now },
    ],
  })

  // Matching ledger entries, so "Payments" and monthly totals line up with the orders.
  await Transaction.insertMany(
    [
      { doc: bill, kind: "bill", description: `KESCO bill for ${mother.fullName}`, at: addDays(now, -7) },
      { doc: gift, kind: "gift", description: `${bouquet.name} for ${mother.fullName}`, at: addDays(now, -1) },
      { doc: booking, kind: "booking", description: `${clean.title} for ${grandpa.fullName}`, at: now },
    ].map(({ doc, kind, description, at }) => ({
      customer: arben._id,
      subjectKind: kind,
      subjectId: doc._id,
      subjectReference: doc.reference,
      description,
      type: "charge",
      amountCents: doc.totalCents,
      provider: "test",
      providerReference: `test_ch_seed_${doc.reference}`,
      status: "succeeded",
      createdAt: at,
    })),
  )

  return true
}
