/**
 * Usage:
 *   npm run seed            -> creates the admin account from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD
 *   npm run seed -- --demo  -> also creates demo customers, vendors, catalog and orders
 *
 * Reads .env.local / .env automatically.
 */
import mongoose from "mongoose"
import { DEMO_ACCOUNTS, DEMO_PASSWORD, ensureAdmin, seedDemoData } from "../lib/seed"

for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file)
  } catch {
    // file is optional
  }
}

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri || uri === "memory") {
    throw new Error("Set MONGODB_URI to a real database. The in-memory database seeds itself on start.")
  }
  await mongoose.connect(uri)

  const email = process.env.SEED_ADMIN_EMAIL
  const password = process.env.SEED_ADMIN_PASSWORD
  if (email && password) {
    if (password.length < 12) throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters.")
    await ensureAdmin(email, password)
    console.log(`Admin account ready: ${email}`)
  } else {
    console.log("SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set, skipping admin account.")
  }

  if (process.argv.includes("--demo")) {
    if (process.env.NODE_ENV === "production") throw new Error("Refusing to create demo data in production.")
    const created = await seedDemoData()
    console.log(created ? "Demo data created." : "Demo data already present.")
    console.log(`Demo logins (password "${DEMO_PASSWORD}"): ${Object.values(DEMO_ACCOUNTS).join(", ")}`)
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(() => mongoose.disconnect())
