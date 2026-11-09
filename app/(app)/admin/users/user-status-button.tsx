"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { setUserStatusAction } from "../actions"

export function UserStatusButton({ userId, status }: { userId: string; status: "active" | "disabled" }) {
  const [pending, startTransition] = useTransition()
  const next = status === "active" ? "disabled" : "active"
  return (
    <Button
      variant={status === "active" ? "ghost" : "outline"}
      size="sm"
      disabled={pending}
      className={status === "active" ? "text-muted-foreground hover:text-destructive" : undefined}
      onClick={() =>
        startTransition(async () => {
          const res = await setUserStatusAction(userId, next)
          if (res.error) toast.error(res.error)
          else toast.success(res.message)
        })
      }
    >
      {status === "active" ? "Disable" : "Enable"}
    </Button>
  )
}
