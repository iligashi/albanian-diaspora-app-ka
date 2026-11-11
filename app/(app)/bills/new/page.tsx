import type { Metadata } from "next"
import Link from "next/link"
import { Users } from "lucide-react"
import { EmptyState, PageHeader } from "@/components/shared/primitives"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/auth/session"
import { recipientOptions } from "@/lib/recipient-options"
import { walletOptions } from "@/lib/wallet-options"
import { BillForm } from "./bill-form"

export const metadata: Metadata = { title: "Pay a bill" }

export default async function NewBillPage() {
  const user = await requireUser("customer")
  const [recipients, wallets] = await Promise.all([recipientOptions(user.id), walletOptions(user.id)])

  return (
    <>
      <PageHeader title="Pay a bill" back={{ href: "/bills", label: "Bills" }} description="Usually settled with the provider within one working day." />
      {recipients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Add a family member first"
          description="Bills are recorded against the person whose household they belong to."
          action={
            <Button asChild>
              <Link href="/family">Add family member</Link>
            </Button>
          }
        />
      ) : (
        <BillForm recipients={recipients} wallets={wallets} />
      )}
    </>
  )
}
