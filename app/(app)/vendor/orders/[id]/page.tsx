import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { isValidObjectId } from "mongoose"
import { ProofGallery, VoiceNote } from "@/components/shared/proof"
import { ProofUpload } from "../../proof-upload"
import { DetailList, PageHeader, Section, StatusBadge, Timeline } from "@/components/shared/primitives"
import { TransitionButtons } from "@/components/shared/transition-buttons"
import { requireUser } from "@/lib/auth/session"
import { availableActions, giftMachine } from "@/lib/domain/workflow"
import { formatMoney } from "@/lib/money"
import { GiftOrder } from "@/lib/models"
import { getVendorForUser } from "@/lib/services/vendor"
import { formatDate } from "@/lib/utils"
import { vendorGiftAction } from "../../actions"

export const metadata: Metadata = { title: "Gift order" }

export default async function VendorOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("vendor")
  const vendor = await getVendorForUser(user.id)
  if (!vendor) redirect("/vendor")
  const { id } = await params
  if (!isValidObjectId(id)) notFound()
  const order = await GiftOrder.findOne({ _id: id, vendor: vendor._id }).lean()
  if (!order) notFound()
  const actions = vendor.status === "approved" ? availableActions(giftMachine, order.status, "vendor") : []

  return (
    <>
      <PageHeader
        title={order.reference}
        description={`Deliver by ${formatDate(order.deliveryDate)} in ${order.recipient.city}`}
        back={{ href: "/vendor/orders", label: "Gift orders" }}
        actions={<StatusBadge status={order.status} className="text-sm" />}
      />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          {actions.length > 0 && (
            <Section title="Next step">
              <div className="p-5">
                <TransitionButtons actions={actions} run={vendorGiftAction.bind(null, order._id.toString())} withNote />
              </div>
            </Section>
          )}
          {order.voiceNote && (
            <Section title="Voice message from the family">
              <VoiceNote id={order.voiceNote} caption="Play this to the recipient when you hand over the gift." />
            </Section>
          )}
          {["accepted", "out_for_delivery", "delivered"].includes(order.status) && (
            <Section title="Delivery photos">
              <ProofGallery photos={order.proofPhotos ?? []} />
              {(order.proofPhotos?.length ?? 0) < 6 && <ProofUpload kind="gift" orderId={order._id.toString()} />}
            </Section>
          )}
          <Section title="Items">
            <ul className="divide-y">
              {order.items.map((i) => (
                <li key={i.product.toString()} className="flex justify-between px-5 py-3 text-sm">
                  <span>
                    {i.name} <span className="text-muted-foreground">× {i.quantity}</span>
                  </span>
                  <span className="tabular font-medium">{formatMoney(i.unitPriceCents * i.quantity)}</span>
                </li>
              ))}
              <li className="flex justify-between px-5 py-3 text-sm font-semibold">
                <span>Your payout</span>
                <span className="tabular">{formatMoney(order.subtotalCents)}</span>
              </li>
            </ul>
          </Section>
          <Section title="Delivery">
            <DetailList
              items={[
                ["Recipient", order.recipient.fullName],
                ["Address", `${order.recipient.addressLine}, ${order.recipient.city}`],
                ["Phone", order.recipient.phone],
                ["Deliver on", formatDate(order.deliveryDate)],
                ["Card message", order.message ? <span className="whitespace-pre-line italic">“{order.message}”</span> : "No message"],
              ]}
            />
          </Section>
        </div>
        <Section title="Timeline" className="h-fit">
          <Timeline events={order.events} />
        </Section>
      </div>
    </>
  )
}
