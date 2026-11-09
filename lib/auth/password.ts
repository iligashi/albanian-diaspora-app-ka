import bcrypt from "bcryptjs"

const ROUNDS = 12

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, ROUNDS)
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash)
}

let dummyHash: Promise<string> | null = null

/**
 * Burns the same CPU time as a real check. Used when the email is unknown so
 * response timing doesn't reveal which emails are registered.
 */
export async function verifyAgainstDummy(plain: string) {
  dummyHash ??= hashPassword(crypto.randomUUID())
  await bcrypt.compare(plain, await dummyHash)
  return false
}
