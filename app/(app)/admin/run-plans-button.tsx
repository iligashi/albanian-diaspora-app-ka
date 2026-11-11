"use client"

import { useTransition } from "react"
import { Repeat } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { runPlansAction } from "./actions"

/** Runs due recurring plans and birthday reminders now. In production a daily cron calls /api/cron/daily. */
export function RunPlansButton() {
  const [pending, start] = useTransition()
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await runPlansAction()
          if (res.error) toast.error(res.error)
          else toast.success(res.message)
        })
      }
    >
      <Repeat /> {pending ? "Running…" : "Run due plans now"}
    </Button>
  )
}
