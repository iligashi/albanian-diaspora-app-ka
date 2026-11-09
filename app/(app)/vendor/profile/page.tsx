import type { Metadata } from "next"
import { PageHeader, StatusBadge } from "@/components/shared/primitives"
import { requireUser } from "@/lib/auth/session"
import { getVendorForUser } from "@/lib/services/vendor"
import { VendorProfileForm } from "./vendor-profile-form"

export const metadata: Metadata = { title: "Business profile" }

export default async function VendorProfilePage() {
  const user = await requireUser("vendor")
  const vendor = await getVendorForUser(user.id)

  return (
    <>
      <PageHeader
        title={vendor ? "Business profile" : "Set up your business"}
        description={
          vendor
            ? "This is what families see when they browse your products or services."
            : "Tell us about your business. Our team reviews every new vendor, usually within one working day."
        }
        actions={vendor && <StatusBadge status={vendor.status} className="text-sm" />}
      />
      <VendorProfileForm
        existing={
          vendor
            ? {
                businessName: vendor.businessName,
                kind: vendor.kind,
                phone: vendor.phone,
                city: vendor.city,
                serviceCities: vendor.serviceCities,
                description: vendor.description ?? "",
              }
            : null
        }
      />
    </>
  )
}
