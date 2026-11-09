"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BadgeCheck,
  Bell,
  CalendarDays,
  Gift,
  Home,
  LogOut,
  Menu,
  Package,
  Receipt,
  Settings,
  ShieldCheck,
  Store,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn, initials } from "@/lib/utils"
import type { Role } from "@/lib/models"
import { NAV, SECONDARY_NAV, type NavIcon, type NavItem } from "./nav"
import { Logo } from "./primitives"

const ICONS: Record<NavIcon, LucideIcon> = {
  home: Home,
  users: Users,
  receipt: Receipt,
  gift: Gift,
  wrench: Wrench,
  wallet: Wallet,
  bell: Bell,
  settings: Settings,
  package: Package,
  calendar: CalendarDays,
  store: Store,
  shield: ShieldCheck,
  badge: BadgeCheck,
}

const ROLE_LABEL: Record<Role, string> = { customer: "Family account", vendor: "Vendor", admin: "Operations" }

type ShellUser = { firstName: string; lastName: string; email: string; role: Role }

export function AppShell({
  user,
  unread,
  hiddenNav = [],
  logoutAction,
  children,
}: {
  user: ShellUser
  unread: number
  hiddenNav?: string[]
  logoutAction: () => Promise<void>
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const items = NAV[user.role].filter((i) => !hiddenNav.includes(i.href))

  const sidebar = (
    <div className="flex h-full flex-col bg-ink text-ink-foreground">
      <div className="flex h-16 items-center px-5">
        <Logo inverted />
      </div>
      <p className="px-5 pb-2 text-[11px] font-medium uppercase tracking-wider text-ink-foreground/50">{ROLE_LABEL[user.role]}</p>
      <nav className="flex-1 space-y-0.5 px-3" onClick={() => setOpen(false)}>
        {items.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>
      <nav className="space-y-0.5 border-t border-white/10 px-3 py-3" onClick={() => setOpen(false)}>
        {SECONDARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} badge={item.icon === "bell" ? unread : undefined} />
        ))}
      </nav>
    </div>
  )

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-screen lg:block">{sidebar}</aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur sm:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[264px] border-0 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              {sidebar}
            </SheetContent>
          </Sheet>
          <div className="lg:hidden">
            <Logo />
          </div>

          <div className="ml-auto flex items-center gap-1">
            <Button asChild variant="ghost" size="icon" aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}>
              <Link href="/notifications" className="relative">
                <Bell />
                {unread > 0 && (
                  <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 gap-2 px-2">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
                      {initials(user.firstName, user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:inline">{user.firstName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="font-medium">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="size-4" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <form action={logoutAction} className="w-full">
                    <button type="submit" className="flex w-full items-center gap-2">
                      <LogOut className="size-4" /> Sign out
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  )
}

function NavLink({ item, badge }: { item: NavItem; badge?: number }) {
  const pathname = usePathname()
  const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)
  const Icon = ICONS[item.icon]
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-white/10 text-white" : "text-ink-foreground/70 hover:bg-white/5 hover:text-white",
      )}
    >
      <Icon className={cn("size-4", active && "text-primary")} />
      <span className="flex-1">{item.label}</span>
      {badge ? <span className="rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">{badge}</span> : null}
    </Link>
  )
}
