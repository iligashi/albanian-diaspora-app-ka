import "server-only"
import { walletsFor } from "./services/wallet"

export type WalletOption = { id: string; name: string; kind: "personal" | "family"; balanceCents: number; members: number }

/** Wallets the customer can pay from, for the "Pay with" choice on order forms. */
export async function walletOptions(userId: string): Promise<WalletOption[]> {
  const wallets = await walletsFor(userId)
  return wallets.map((w) => ({ id: w._id.toString(), name: w.name, kind: w.kind, balanceCents: w.balanceCents, members: w.members.length }))
}
