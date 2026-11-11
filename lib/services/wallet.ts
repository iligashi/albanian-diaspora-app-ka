import "server-only"
import { randomBytes } from "node:crypto"
import { Types } from "mongoose"
import { formatMoney } from "../money"
import { User, Wallet, WalletEntry, WalletInvite, type SubjectKind, type WalletDoc, type WalletEntryType } from "../models"
import { paymentProvider } from "../payments"
import { AppError, notify } from "./core"

/**
 * Wallets let relatives abroad pool money for the family back home. A wallet is
 * a payment method like a card: orders paid from it are refunded back into it.
 * Balances only change through `$inc` guarded by the balance itself, so two
 * siblings spending at once can never take the wallet below zero.
 */

export const MAX_FAMILY_WALLETS = 5
export const MAX_WALLET_MEMBERS = 12
export const REFERRAL_BONUS_CENTS = 500

const oid = (id: string | Types.ObjectId) => (typeof id === "string" ? new Types.ObjectId(id) : id)

export async function personalWallet(userId: string | Types.ObjectId) {
  const owner = oid(userId)
  const existing = await Wallet.findOne({ owner, kind: "personal" }).lean<WalletDoc>()
  if (existing) return existing
  const created = await Wallet.create({ kind: "personal", name: "My wallet", owner, members: [{ user: owner }], balanceCents: 0 })
  return created.toObject() as WalletDoc
}

export async function walletsFor(userId: string) {
  await personalWallet(userId)
  return Wallet.find({ "members.user": oid(userId) }).sort({ kind: -1, createdAt: 1 }).lean<WalletDoc[]>()
}

/** The wallet, if the user belongs to it. Same error as "not found" so ids can't be probed. */
export async function memberWallet(userId: string, walletId: string) {
  if (!Types.ObjectId.isValid(walletId)) throw new AppError("Wallet not found.")
  const wallet = await Wallet.findOne({ _id: walletId, "members.user": oid(userId) }).lean<WalletDoc>()
  if (!wallet) throw new AppError("Wallet not found.")
  return wallet
}

export async function createFamilyWallet(userId: string, name: string) {
  const count = await Wallet.countDocuments({ owner: oid(userId), kind: "family" })
  if (count >= MAX_FAMILY_WALLETS) throw new AppError(`You can create up to ${MAX_FAMILY_WALLETS} family wallets.`)
  return Wallet.create({ kind: "family", name, owner: userId, members: [{ user: userId }], balanceCents: 0 })
}

// ------------------------------------------------------------------ members

export async function inviteToWallet(userId: string, walletId: string, email: string) {
  const wallet = await memberWallet(userId, walletId)
  if (wallet.kind !== "family") throw new AppError("Only family wallets can be shared.")
  if (wallet.members.length >= MAX_WALLET_MEMBERS) throw new AppError(`A wallet can have up to ${MAX_WALLET_MEMBERS} members.`)

  const invitee = await User.findOne({ email }).select("_id role firstName").lean()
  if (invitee && wallet.members.some((m) => m.user.equals(invitee._id))) throw new AppError("They're already in this wallet.")
  if (invitee && invitee.role !== "customer") throw new AppError("Only customer accounts can join a family wallet.")
  if (await WalletInvite.exists({ wallet: wallet._id, email, status: "pending" })) throw new AppError("An invitation is already waiting for them.")

  await WalletInvite.create({ wallet: wallet._id, email, invitedBy: userId })
  // People without an account see the invitation as soon as they sign up with this email.
  if (invitee) await notify(invitee._id, "You're invited to a family wallet", `Join "${wallet.name}" to share family costs.`, "/wallet")
}

export async function pendingInvitesFor(email: string) {
  return WalletInvite.find({ email, status: "pending" }).populate<{ wallet: WalletDoc }>("wallet").populate("invitedBy", "firstName lastName").lean()
}

export async function respondToInvite(user: { id: string; email: string }, inviteId: string, accept: boolean) {
  const invite = await WalletInvite.findOneAndUpdate(
    { _id: inviteId, email: user.email, status: "pending" },
    { $set: { status: accept ? "accepted" : "declined" } },
    { new: true },
  ).lean()
  if (!invite) throw new AppError("This invitation is no longer available.")
  if (!accept) return null

  const joined = await Wallet.findOneAndUpdate(
    { _id: invite.wallet, "members.user": { $ne: oid(user.id) }, [`members.${MAX_WALLET_MEMBERS - 1}`]: { $exists: false } },
    { $push: { members: { user: oid(user.id), joinedAt: new Date() } } },
    { new: true },
  ).lean<WalletDoc>()
  if (!joined) throw new AppError("You couldn't be added to this wallet. It may be full.")
  const others = joined.members.filter((m) => !m.user.equals(oid(user.id)))
  await Promise.all(others.map((m) => notify(m.user, "New wallet member", `Someone joined "${joined.name}".`, `/wallet/${joined._id}`)))
  return joined
}

export async function leaveWallet(userId: string, walletId: string) {
  const wallet = await memberWallet(userId, walletId)
  if (wallet.kind === "personal") throw new AppError("You can't leave your personal wallet.")
  if (wallet.owner.equals(oid(userId))) throw new AppError("The person who created the wallet can't leave it.")
  await Wallet.updateOne({ _id: wallet._id }, { $pull: { members: { user: oid(userId) } } })
}

// ------------------------------------------------------------------ money

async function entry(walletId: Types.ObjectId, userId: Types.ObjectId, type: WalletEntryType, amountCents: number, balanceAfterCents: number, description: string, extra: Record<string, unknown> = {}) {
  return WalletEntry.create({ wallet: walletId, user: userId, type, amountCents, balanceAfterCents, description, ...extra })
}

/** Adds money to a wallet by charging the member's card. */
export async function topUp(userId: string, walletId: string, amountCents: number) {
  const wallet = await memberWallet(userId, walletId)
  const result = await paymentProvider().charge({
    amountCents,
    description: `Top-up: ${wallet.name}`,
    reference: `WT-${randomBytes(4).toString("hex").toUpperCase()}`,
    customerId: userId,
  })
  if (!result.ok) throw new AppError(`Your card was declined: ${result.reason}`)
  const updated = await Wallet.findByIdAndUpdate(wallet._id, { $inc: { balanceCents: amountCents } }, { new: true }).lean<WalletDoc>()
  await entry(wallet._id, oid(userId), "top_up", amountCents, updated!.balanceCents, "Top-up by card", { providerReference: result.providerReference })
  if (wallet.kind === "family") {
    const others = wallet.members.filter((m) => !m.user.equals(oid(userId)))
    await Promise.all(others.map((m) => notify(m.user, `${formatMoney(amountCents)} added to "${wallet.name}"`, "A family member topped up your shared wallet.", `/wallet/${wallet._id}`)))
  }
  return updated!
}

type Subject = { kind: SubjectKind; id: Types.ObjectId; description: string }

/** Spends from a wallet. Fails cleanly (no partial state) when the balance is too low or the user isn't a member. */
export async function debitWallet(walletId: string | Types.ObjectId, userId: string | Types.ObjectId, amountCents: number, subject: Subject) {
  const updated = await Wallet.findOneAndUpdate(
    { _id: oid(walletId), "members.user": oid(userId), balanceCents: { $gte: amountCents } },
    { $inc: { balanceCents: -amountCents } },
    { new: true },
  ).lean<WalletDoc>()
  if (!updated) {
    const exists = await Wallet.exists({ _id: oid(walletId), "members.user": oid(userId) })
    return { ok: false as const, reason: exists ? "Not enough money in the wallet" : "Wallet not available" }
  }
  const e = await entry(updated._id, oid(userId), "payment", -amountCents, updated.balanceCents, subject.description, { subjectKind: subject.kind, subjectId: subject.id })
  await warnIfLow(updated)
  return { ok: true as const, providerReference: e._id.toString() }
}

export async function creditWallet(walletId: string | Types.ObjectId, userId: string | Types.ObjectId, amountCents: number, type: "refund" | "bonus", description: string, subject?: Subject) {
  const updated = await Wallet.findByIdAndUpdate(oid(walletId), { $inc: { balanceCents: amountCents } }, { new: true }).lean<WalletDoc>()
  if (!updated) return { ok: false as const, reason: "Wallet not found" }
  const e = await entry(updated._id, oid(userId), type, amountCents, updated.balanceCents, description, subject ? { subjectKind: subject.kind, subjectId: subject.id } : {})
  return { ok: true as const, providerReference: e._id.toString() }
}

const LOW_BALANCE_CENTS = 2000

async function warnIfLow(wallet: WalletDoc) {
  if (wallet.kind !== "family" || wallet.balanceCents >= LOW_BALANCE_CENTS) return
  await Promise.all(
    wallet.members.map((m) => notify(m.user, `"${wallet.name}" is running low`, `Only ${formatMoney(wallet.balanceCents)} left. Top it up so family payments keep going.`, `/wallet/${wallet._id}`)),
  )
}

/** Who put how much into a shared wallet: the end of "I always pay, you never do". */
export async function contributions(walletId: Types.ObjectId) {
  return WalletEntry.aggregate<{ _id: Types.ObjectId; toppedUp: number; spent: number }>([
    { $match: { wallet: walletId } },
    {
      $group: {
        _id: "$user",
        toppedUp: { $sum: { $cond: [{ $eq: ["$type", "top_up"] }, "$amountCents", 0] } },
        spent: { $sum: { $cond: [{ $eq: ["$type", "payment"] }, { $multiply: ["$amountCents", -1] }, 0] } },
      },
    },
  ])
}

// ------------------------------------------------------------------ referrals

export async function ensureReferralCode(userId: string) {
  const user = await User.findById(userId).select("referralCode firstName").lean()
  if (!user) throw new AppError("User not found.")
  if (user.referralCode) return user.referralCode
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = `${user.firstName.replace(/[^a-z]/gi, "").slice(0, 6).toUpperCase() || "FAM"}${randomBytes(2).toString("hex").toUpperCase()}`
    try {
      const updated = await User.findOneAndUpdate({ _id: userId, referralCode: { $exists: false } }, { $set: { referralCode: code } }, { new: true }).lean()
      return updated?.referralCode ?? (await User.findById(userId).select("referralCode").lean())!.referralCode!
    } catch {
      // Code collision on the unique index: try another one.
    }
  }
  throw new AppError("Couldn't create an invite code. Please try again.")
}

/** After a referred user's first successful payment, both people get wallet credit. Runs at most once per user. */
export async function rewardReferral(customerId: Types.ObjectId) {
  const user = await User.findOneAndUpdate(
    { _id: customerId, referredBy: { $exists: true }, referralRewardedAt: { $exists: false } },
    { $set: { referralRewardedAt: new Date() } },
    { new: true },
  ).lean()
  if (!user?.referredBy) return
  const [mine, theirs] = await Promise.all([personalWallet(user._id), personalWallet(user.referredBy)])
  await creditWallet(mine._id, user._id, REFERRAL_BONUS_CENTS, "bonus", "Welcome bonus for joining with an invite")
  await creditWallet(theirs._id, user.referredBy, REFERRAL_BONUS_CENTS, "bonus", `Thank you: ${user.firstName} joined with your invite`)
  await notify(user.referredBy, `You earned ${formatMoney(REFERRAL_BONUS_CENTS)}`, `${user.firstName} made their first payment. The credit is in your wallet.`, "/wallet")
  await notify(user._id, `${formatMoney(REFERRAL_BONUS_CENTS)} welcome credit`, "Thanks for joining with an invite. The credit is in your wallet.", "/wallet")
}
