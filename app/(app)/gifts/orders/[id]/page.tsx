import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { isValidObjectId } from "mongoose"
import { CheckCircle2 } from "lucide-react"
import { DetailList, PageHeader, PriceBreakdown, Section, StatusBadge, Timeline } from "@/components/shared/primitives"
import { ProgressSteps } from "@/components/shared/progress-steps"
import { TransitionButtons } from "@/components/shared/transition-buttons"
import { requireUser } from "@/lib/auth/session"
import { availableActions, GIFT_STEPS, giftMachine, lastProgressStatus } from "@/lib/domain/workflow"
import { formatMoney } from "@/lib/money"
import { GiftOrder, Vendor } from "@/lib/models"
import { formatDate, humanize } from "@/lib/utils"
import { cancelGiftOrderAction } from "../../../customer-actions"

export const metadata: Metadata = { title: "Gift order" }

export default async function GiftOrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
  const user = await requireUser("customer")
  const [{ id }, { new: isNew }] = await Promise.all([params, searchParams])
  if (!isValidObjectId(id)) notFound()
  const order = await GiftOrder.findOne({ _id: id, customer: user.id }).lean()
  if (!order) notFound()
  const vendor = await Vendor.findById(order.vendor).lean()

  const lastProgress = lastProgressStatus(order.events, GIFT_STEPS)
  const ended = ["rejected", "cancelled"].includes(order.status) ? humanize(order.status) : undefined
  const actions = availableActions(giftMachine, order.status, "customer")

  return (
    <>
      <PageHeader
        title={order.items.map((i) => i.name).join(", ")}
        description={`${order.reference} · for ${order.recipient.fullName}`}
        back={{ href: "/gifts/orders", label: "My orders" }}
        actions={<StatusBadge status={order.status} className="text-sm" />}
      />

      {isNew && order.status === "placed" && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
          <p>
            <strong>Order placed.</strong> {vendor?.businessName} has been notified and will confirm shortly.
          </p>
        </div>
      )}

      {order.status !== "payment_failed" && (
        <div className="mb-6 rounded-xl border bg-card p-5">
          <ProgressSteps steps={GIFT_STEPS} status={ended ? lastProgress : order.status} endedAs={ended} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Section title="Delivery">
            <DetailList
              items={[
                ["Recipient", order.recipient.fullName],
                ["Address", `${order.recipient.addressLine}, ${order.recipient.city}`],
                ["Phone", order.recipient.phone],
                ["Delivery date", formatDate(order.deliveryDate)],
                ["Shop", vendor ? `${vendor.businessName} · ${vendor.phone}` : null],
                ["Message", order.message ? <span className="whitespace-pre-line italic">“{order.message}”</span> : null],
              ]}
            />
          </Section>
          <Section title="Payment">
            <div className="space-y-4 p-5">
              <PriceBreakdown
                lines={[
                  ...order.items.map((i): [string, string] => [`${i.name} × ${i.quantity}`, formatMoney(i.unitPriceCents * i.quantity)]),
                  ["Service fee", formatMoney(order.feeCents)],
                ]}
                total={formatMoney(order.totalCents)}
              />
              {actions.length > 0 && (
                <div className="border-t pt-4">
                  <p className="mb-3 text-xs text-muted-foreground">Changed your mind? You can cancel for a full refund until the shop accepts.</p>
                  <TransitionButtons actions={actions} run={cancelGiftOrderAction.bind(null, order._id.toString())} />
                </div>
              )}
            </div>
          </Section>
        </div>
        <Section title="Timeline" className="h-fit">
          <Timeline events={order.events} />
        </Section>
      </div>
    </>
  )
}
