import type { Metadata } from "next"
import { SubNav } from "@/components/shared/filters"
import { PageHeader } from "@/components/shared/primitives"
import { requireUser } from "@/lib/auth/session"
import { User } from "@/lib/models"
import { formatDate, humanize } from "@/lib/utils"
import { UserStatusButton } from "./user-status-button"

export const metadata: Metadata = { title: "Users" }

const ROLES = ["customer", "vendor", "admin"] as const

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ role?: string; q?: string }> }) {
  const admin = await requireUser("admin")
  const { role: raw, q } = await searchParams
  const role = ROLES.includes(raw as (typeof ROLES)[number]) ? (raw as (typeof ROLES)[number]) : "customer"
  const search = q?.trim().slice(0, 60)
  const escaped = search?.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const users = await User.find({
    role,
    ...(escaped ? { $or: [{ email: new RegExp(escaped, "i") }, { firstName: new RegExp(escaped, "i") }, { lastName: new RegExp(escaped, "i") }] } : {}),
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()

  return (
    <>
      <PageHeader title="Users" description="Disable an account to sign the person out and block access immediately." />
      <SubNav current={`/admin/users?role=${role}`} items={ROLES.map((r) => ({ href: `/admin/users?role=${r}`, label: `${humanize(r)}s` }))} />
      <form className="mb-4">
        <input type="hidden" name="role" value={role} />
        <input
          name="q"
          defaultValue={search}
          placeholder="Search name or email…"
          className="h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </form>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Joined</th>
              <th className="px-5 py-3 font-medium">Last sign-in</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u._id.toString()}>
                <td className="px-5 py-3">
                  <p className="font-medium">
                    {u.firstName} {u.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {u.email}
                    {u.country ? ` · ${u.country}` : ""}
                  </p>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                <td className="px-5 py-3 text-muted-foreground">{formatDate(u.lastLoginAt)}</td>
                <td className="px-5 py-3">
                  <span className={u.status === "active" ? "text-xs font-medium text-emerald-700" : "text-xs font-medium text-destructive"}>
                    {humanize(u.status)}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  {u._id.toString() !== admin.id && <UserStatusButton userId={u._id.toString()} status={u.status} />}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
