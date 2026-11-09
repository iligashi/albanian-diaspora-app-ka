/**
 * Static reference data for the Kosovo market. Kept in code (not the database)
 * because it changes rarely and drives validation on both client and server.
 */

export const CITIES = [
  "Prishtinë",
  "Prizren",
  "Pejë",
  "Gjakovë",
  "Mitrovicë",
  "Ferizaj",
  "Gjilan",
  "Vushtrri",
  "Podujevë",
  "Suharekë",
  "Rahovec",
  "Drenas",
  "Lipjan",
  "Malishevë",
  "Kamenicë",
  "Viti",
  "Deçan",
  "Istog",
  "Klinë",
  "Skenderaj",
  "Dragash",
  "Fushë Kosovë",
  "Kaçanik",
  "Shtime",
] as const
export type City = (typeof CITIES)[number]

export const RELATIONSHIPS = ["parent", "grandparent", "spouse", "child", "sibling", "relative", "friend", "other"] as const
export type Relationship = (typeof RELATIONSHIPS)[number]

export const BILL_CATEGORIES = ["electricity", "water", "internet", "mobile", "waste", "rent", "other"] as const
export type BillCategory = (typeof BILL_CATEGORIES)[number]

/** Utility providers a bill can be paid to. `accountLabel` is what the provider calls the customer number. */
export const BILL_PROVIDERS = [
  { id: "kesco", name: "KESCO", category: "electricity", accountLabel: "Customer number" },
  { id: "kru-prishtina", name: "KRU Prishtina", category: "water", accountLabel: "Consumer code" },
  { id: "kru-hidroregjioni-jugor", name: "Hidroregjioni Jugor (Prizren)", category: "water", accountLabel: "Consumer code" },
  { id: "kru-hidrodrini", name: "Hidrodrini (Pejë)", category: "water", accountLabel: "Consumer code" },
  { id: "kru-radoniqi", name: "Radoniqi (Gjakovë)", category: "water", accountLabel: "Consumer code" },
  { id: "kru-mitrovica", name: "KRU Mitrovica", category: "water", accountLabel: "Consumer code" },
  { id: "kru-bifurkacioni", name: "Bifurkacioni (Ferizaj)", category: "water", accountLabel: "Consumer code" },
  { id: "kru-hidromorava", name: "Hidromorava (Gjilan)", category: "water", accountLabel: "Consumer code" },
  { id: "ipko", name: "IPKO", category: "internet", accountLabel: "Contract number" },
  { id: "telekomi", name: "Telekomi i Kosovës", category: "internet", accountLabel: "Contract number" },
  { id: "kujtesa", name: "Kujtesa", category: "internet", accountLabel: "Contract number" },
  { id: "artmotion", name: "Artmotion", category: "internet", accountLabel: "Contract number" },
  { id: "vala", name: "Vala (mobile)", category: "mobile", accountLabel: "Phone number" },
  { id: "ipko-mobile", name: "IPKO (mobile)", category: "mobile", accountLabel: "Phone number" },
  { id: "waste-municipal", name: "Municipal waste company", category: "waste", accountLabel: "Customer number" },
  { id: "landlord", name: "Landlord (rent)", category: "rent", accountLabel: "IBAN or account" },
  { id: "other", name: "Other provider", category: "other", accountLabel: "Account / reference" },
] as const satisfies ReadonlyArray<{ id: string; name: string; category: BillCategory; accountLabel: string }>

export type BillProviderId = (typeof BILL_PROVIDERS)[number]["id"]
export const BILL_PROVIDER_IDS = BILL_PROVIDERS.map((p) => p.id) as [BillProviderId, ...BillProviderId[]]

export function getBillProvider(id: string) {
  return BILL_PROVIDERS.find((p) => p.id === id)
}

export const GIFT_CATEGORIES = ["flowers", "cakes", "food_baskets", "sweets", "household", "other"] as const
export type GiftCategory = (typeof GIFT_CATEGORIES)[number]

export const SERVICE_CATEGORIES = [
  "cleaning",
  "plumbing",
  "electrical",
  "repairs",
  "gardening",
  "elderly_care",
  "transport",
  "other",
] as const
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number]

/** Bookable windows. Kept coarse on purpose: vendors confirm the exact time with the family. */
export const TIME_SLOTS = ["08:00–10:00", "10:00–12:00", "12:00–14:00", "14:00–16:00", "16:00–18:00"] as const
export type TimeSlot = (typeof TIME_SLOTS)[number]

export const VENDOR_KINDS = ["gifts", "services"] as const
export type VendorKind = (typeof VENDOR_KINDS)[number]
