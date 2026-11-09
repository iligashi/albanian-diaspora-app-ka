import type { Metadata } from "next"
import Link from "next/link"
import { Bell } from "lucide-react"
import { EmptyState, PageHeader } from "@/components/shared/primitives"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/auth/session"
import { Notification } from "@/lib/models"
import { cn, formatDateTime } from "@/lib/utils"
import { markAllNotificationsReadAction } from "../account-actions"

export const metadata: Metadata = { title: "Notifications" }

export default async function NotificationsPage() {
  const user = await requireUser()
  const notifications = await Notification.find({ user: user.id }).sort({ createdAt: -1 }).limit(100).lean()
  const unread = notifications.filter((n) => !n.readAt).length

  async function markAllRead() {
    "use server"
    await markAllNotificationsReadAction()
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        description={unread ? `${unread} unread` : "You're all caught up."}
        actions={
          unread > 0 && (
            <form action={markAllRead}>
              <Button variant="outline" type="submit">
                Mark all as read
              </Button>
            </form>
          )
        }
      />
      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="Updates on your orders and account will show up here." />
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {notifications.map((n) => {
            const body = (
              <div className="flex gap-3 px-5 py-4">
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.readAt ? "bg-transparent" : "bg-primary")} />
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm", !n.readAt && "font-semibold")}>{n.title}</p>
                  <p className="text-sm text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</p>
                </div>
              </div>
            )
            return (
              <li key={n._id.toString()} className={cn(!n.readAt && "bg-accent/30")}>
                {n.href ? (
                  <Link href={n.href} className="block hover:bg-muted/40">
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
