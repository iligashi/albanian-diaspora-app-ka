/**
 * Order lifecycles as explicit state machines.
 *
 * Every status change in the app goes through `assertTransition`, so the rules
 * for who may move an order where live in one place (and are unit tested),
 * instead of being scattered across route handlers.
 */

export type Actor = "customer" | "vendor" | "admin" | "system"

type Transition<S extends string> = {
  to: S
  actors: readonly Actor[]
  /** Label for the button that performs this transition. */
  label?: string
  /** The customer's payment is refunded when this transition happens. */
  refunds?: boolean
}

type Machine<S extends string> = {
  name: string
  initial: S
  terminal: readonly S[]
  transitions: { [K in S]: readonly Transition<S>[] }
}

function defineMachine<S extends string>(machine: Machine<S>) {
  return machine
}

export const BILL_STATUSES = ["awaiting_payment", "paid", "settled", "payment_failed", "refunded"] as const
export type BillStatus = (typeof BILL_STATUSES)[number]

export const billMachine = defineMachine<BillStatus>({
  name: "bill",
  initial: "awaiting_payment",
  terminal: ["settled", "refunded"],
  transitions: {
    awaiting_payment: [
      { to: "paid", actors: ["system"] },
      { to: "payment_failed", actors: ["system"] },
    ],
    payment_failed: [{ to: "paid", actors: ["system"] }],
    // Operations pays the utility, then records the provider's receipt number.
    paid: [
      { to: "settled", actors: ["admin"], label: "Mark settled" },
      { to: "refunded", actors: ["admin"], label: "Refund", refunds: true },
    ],
    settled: [],
    refunded: [],
  },
})

export const GIFT_STATUSES = [
  "awaiting_payment",
  "payment_failed",
  "placed",
  "accepted",
  "out_for_delivery",
  "delivered",
  "rejected",
  "cancelled",
] as const
export type GiftStatus = (typeof GIFT_STATUSES)[number]

export const giftMachine = defineMachine<GiftStatus>({
  name: "gift order",
  initial: "awaiting_payment",
  terminal: ["delivered", "rejected", "cancelled"],
  transitions: {
    awaiting_payment: [
      { to: "placed", actors: ["system"] },
      { to: "payment_failed", actors: ["system"] },
    ],
    payment_failed: [{ to: "placed", actors: ["system"] }],
    placed: [
      { to: "accepted", actors: ["vendor"], label: "Accept order" },
      { to: "rejected", actors: ["vendor"], label: "Reject", refunds: true },
      { to: "cancelled", actors: ["customer", "admin"], label: "Cancel order", refunds: true },
    ],
    accepted: [
      { to: "out_for_delivery", actors: ["vendor"], label: "Out for delivery" },
      { to: "cancelled", actors: ["admin"], label: "Cancel order", refunds: true },
    ],
    out_for_delivery: [{ to: "delivered", actors: ["vendor"], label: "Mark delivered" }],
    delivered: [],
    rejected: [],
    cancelled: [],
  },
})

export const BOOKING_STATUSES = [
  "awaiting_payment",
  "payment_failed",
  "requested",
  "confirmed",
  "in_progress",
  "completed",
  "declined",
  "cancelled",
] as const
export type BookingStatus = (typeof BOOKING_STATUSES)[number]

export const bookingMachine = defineMachine<BookingStatus>({
  name: "booking",
  initial: "awaiting_payment",
  terminal: ["completed", "declined", "cancelled"],
  transitions: {
    awaiting_payment: [
      { to: "requested", actors: ["system"] },
      { to: "payment_failed", actors: ["system"] },
    ],
    payment_failed: [{ to: "requested", actors: ["system"] }],
    requested: [
      { to: "confirmed", actors: ["vendor"], label: "Confirm booking" },
      { to: "declined", actors: ["vendor"], label: "Decline", refunds: true },
      { to: "cancelled", actors: ["customer", "admin"], label: "Cancel booking", refunds: true },
    ],
    confirmed: [
      { to: "in_progress", actors: ["vendor"], label: "Start job" },
      { to: "cancelled", actors: ["customer", "admin"], label: "Cancel booking", refunds: true },
    ],
    in_progress: [{ to: "completed", actors: ["vendor"], label: "Mark completed" }],
    completed: [],
    declined: [],
    cancelled: [],
  },
})

/** Happy-path steps shown in the progress tracker. */
export const GIFT_STEPS = [
  { status: "placed", label: "Order placed" },
  { status: "accepted", label: "Shop preparing" },
  { status: "out_for_delivery", label: "Out for delivery" },
  { status: "delivered", label: "Delivered" },
]

export const BOOKING_STEPS = [
  { status: "requested", label: "Requested" },
  { status: "confirmed", label: "Confirmed" },
  { status: "in_progress", label: "In progress" },
  { status: "completed", label: "Completed" },
]

/** Last happy-path status an order reached, used to draw progress for orders that ended early. */
export function lastProgressStatus(events: Array<{ status: string }>, steps: Array<{ status: string }>) {
  return [...events].reverse().find((e) => steps.some((s) => s.status === e.status))?.status ?? steps[0].status
}

export class TransitionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TransitionError"
  }
}

export function findTransition<S extends string>(machine: Machine<S>, from: S, to: S, actor: Actor) {
  return machine.transitions[from]?.find((t) => t.to === to && t.actors.includes(actor))
}

export function assertTransition<S extends string>(machine: Machine<S>, from: S, to: S, actor: Actor) {
  const transition = findTransition(machine, from, to, actor)
  if (!transition) {
    throw new TransitionError(`A ${actor} cannot move a ${machine.name} from "${from}" to "${to}".`)
  }
  return transition
}

/** Transitions a given actor can trigger from the current status (drives the action buttons in the UI). */
export function availableActions<S extends string>(machine: Machine<S>, from: S, actor: Exclude<Actor, "system">) {
  return machine.transitions[from].filter((t) => t.actors.includes(actor) && t.label) as Array<
    Transition<S> & { label: string }
  >
}

export function isTerminal<S extends string>(machine: Machine<S>, status: S) {
  return machine.terminal.includes(status)
}

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger"

const TONES: Record<string, StatusTone> = {
  awaiting_payment: "warning",
  payment_failed: "danger",
  paid: "info",
  placed: "info",
  requested: "info",
  accepted: "info",
  confirmed: "info",
  out_for_delivery: "info",
  in_progress: "info",
  settled: "success",
  delivered: "success",
  completed: "success",
  refunded: "neutral",
  rejected: "danger",
  declined: "danger",
  cancelled: "neutral",
  pending: "warning",
  approved: "success",
  suspended: "danger",
  active: "success",
  paused: "warning",
}

export function statusTone(status: string): StatusTone {
  return TONES[status] ?? "neutral"
}
