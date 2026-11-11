"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { setPlanStatusAction } from "./actions"

export function PlanControls({ planId, status }: { planId: string; status: "active" | "paused" }) {
  const [pending, start] = useTransition()
  const run = (to: "active" | "paused" | "cancelled") =>
    start(async () => {
      if (to === "cancelled" && !confirm("Cancel this plan? Orders already placed are not affected.")) return
      const res = await setPlanStatusAction(planId, to)
      if (res.error) toast.error(res.error)
      else toast.success(res.message)
    })
  return (
    <div className="flex gap-1">
      {status === "active" ? (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run("paused")}>
          Pause
        </Button>
      ) : (
        <Button size="sm" disabled={pending} onClick={() => run("active")}>
          Resume
        </Button>
      )}
      <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" disabled={pending} onClick={() => run("cancelled")}>
        Cancel
      </Button>
    </div>
  )
}
