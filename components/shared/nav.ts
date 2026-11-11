import type { Role } from "@/lib/models"

export type NavItem = { href: string; label: string; icon: NavIcon; exact?: boolean }
export type NavIcon =
  | "home"
  | "users"
  | "receipt"
  | "gift"
  | "wrench"
  | "wallet"
  | "bell"
  | "settings"
  | "package"
  | "calendar"
  | "store"
  | "shield"
  | "badge"
  | "repeat"
  | "chart"
  | "card"

export const NAV: Record<Role, NavItem[]> = {
  customer: [
    { href: "/dashboard", label: "Overview", icon: "home" },
    { href: "/family", label: "Family", icon: "users" },
    { href: "/bills", label: "Bills", icon: "receipt" },
    { href: "/gifts", label: "Gifts", icon: "gift" },
    { href: "/services", label: "Home services", icon: "wrench" },
    { href: "/wallet", label: "Family wallet", icon: "wallet" },
    { href: "/plans", label: "Recurring plans", icon: "repeat" },
    { href: "/activity", label: "Payments", icon: "card", exact: true },
    { href: "/activity/report", label: "Yearly report", icon: "chart" },
  ],
  vendor: [
    { href: "/vendor", label: "Overview", icon: "home", exact: true },
    { href: "/vendor/orders", label: "Gift orders", icon: "package" },
    { href: "/vendor/bookings", label: "Bookings", icon: "calendar" },
    { href: "/vendor/catalog", label: "Catalog", icon: "store" },
    { href: "/vendor/profile", label: "Business profile", icon: "badge" },
  ],
  admin: [
    { href: "/admin", label: "Overview", icon: "home", exact: true },
    { href: "/admin/bills", label: "Bill queue", icon: "receipt" },
    { href: "/admin/vendors", label: "Vendors", icon: "store" },
    { href: "/admin/users", label: "Users", icon: "shield" },
  ],
}

export const SECONDARY_NAV: NavItem[] = [
  { href: "/notifications", label: "Notifications", icon: "bell" },
  { href: "/settings", label: "Settings", icon: "settings" },
]

export const GIFT_TABS = [
  { href: "/gifts", label: "Shop" },
  { href: "/gifts/orders", label: "My orders" },
]

export const SERVICE_TABS = [
  { href: "/services", label: "Find a service" },
  { href: "/services/bookings", label: "My bookings" },
]
