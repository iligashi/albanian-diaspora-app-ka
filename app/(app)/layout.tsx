import { AppShell } from "@/components/shared/app-shell"
import { requireUser } from "@/lib/auth/session"
import { Notification } from "@/lib/models"
import { getVendorForUser } from "@/lib/services/vendor"
import { logout } from "../(auth)/actions"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  const unread = await Notification.countDocuments({ user: user.id, readAt: null })

  // Gift shops don't see bookings and service providers don't see gift orders.
  let hiddenNav: string[] = []
  if (user.role === "vendor") {
    const vendor = await getVendorForUser(user.id)
    if (!vendor) hiddenNav = ["/vendor/orders", "/vendor/bookings", "/vendor/catalog"]
    else hiddenNav = vendor.kind === "gifts" ? ["/vendor/bookings"] : ["/vendor/orders"]
  }

  return (
    <AppShell user={user} unread={unread} hiddenNav={hiddenNav} logoutAction={logout}>
      {children}
    </AppShell>
  )
}
