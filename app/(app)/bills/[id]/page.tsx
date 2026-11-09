import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import { DetailList, PageHeader, PriceBreakdown, Section, StatusBadge, Timeline } from "@/components/shared/primitives"
import { requireUser } from "@/lib/auth/session"
import { getBillProvider } from "@/lib/domain/catalog"
import { formatMoney } from "@/lib/money"
import { Bill } from "@/lib/models"
import { formatDateTime } from "@/lib/utils"
import { isValidObjectId } from "mongoose"

export const metadata: Metadata = { title: "Bill" }

const NEXT_STEP: Record<string, string> = {
  paid: "Paid. Our team will pay the provider and add their receipt number here, usually within one working day.",
  settled: "Done. The provider has received the payment.",
  payment_failed: "The payment didn't go through. Nothing was charged.",
  refunded: "We couldn't complete this bill and refunded you in full.",
}

export default async function BillPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
  const user = await requireUser("customer")
  const [{ id }, { new: isNew }] = await Promise.all([params, searchParams])
  if (!isValidObjectId(id)) notFound()
  const bill = await Bill.findOne({ _id: id, customer: user.id }).lean()
  if (!bill) notFound()
  const provider = getBillProvider(bill.provider)

  return (
    <>
      <PageHeader title={`${provider?.name ?? bill.provider} bill`} description={bill.reference} back={{ href: "/bills", label: "Bills" }} actions={<StatusBadge status={bill.status} className="text-sm" />} />

      {isNew && bill.status === "paid" && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
          <p>
            <strong>Payment received.</strong> We&apos;ll notify you once {provider?.name} confirms it.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Section title="Details">
            <p className="border-b px-5 py-3 text-sm text-muted-foreground">{NEXT_STEP[bill.status]}</p>
            <DetailList
              items={[
                ["Household", `${bill.recipient.fullName}, ${bill.recipient.city}`],
                ["Provider", provider?.name],
                [provider?.accountLabel ?? "Account", <span className="font-mono text-xs">{bill.accountNumber}</span>],
                ["Period", bill.period],
                ["Provider receipt", bill.settlementReference ? <span className="font-mono text-xs">{bill.settlementReference}</span> : null],
                ["Settled", bill.settledAt ? formatDateTime(bill.settledAt) : null],
              ]}
            />
          </Section>
          <Section title="Payment">
            <div className="p-5">
              <PriceBreakdown
                lines={[
                  ["Bill amount", formatMoney(bill.amountCents)],
                  ["Service fee", formatMoney(bill.feeCents)],
                ]}
                total={formatMoney(bill.totalCents)}
              />
            </div>
          </Section>
        </div>
        <Section title="Timeline" className="h-fit">
          <Timeline events={bill.events} />
        </Section>
      </div>
    </>
  )
}
