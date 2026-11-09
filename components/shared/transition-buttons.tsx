"use client"

import { useState, useTransition } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export type ActionButton = { to: string; label: string; refunds?: boolean }

type Result = { ok?: boolean; error?: string; message?: string }

/**
 * Renders the workflow actions the current user may take. Destructive ones
 * (anything that refunds) ask for confirmation and an optional note.
 */
export function TransitionButtons({
  actions,
  run,
  withNote = false,
}: {
  actions: ActionButton[]
  run: (to: string, note?: string) => Promise<Result>
  withNote?: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState<ActionButton | null>(null)
  const [note, setNote] = useState("")

  if (actions.length === 0) return null

  function execute(action: ActionButton, noteValue?: string) {
    startTransition(async () => {
      const result = await run(action.to, noteValue || undefined)
      if (result.error) toast.error(result.error)
      else toast.success(result.message ?? "Updated")
      setConfirming(null)
      setNote("")
    })
  }

  const primary = actions.filter((a) => !a.refunds)
  const destructive = actions.filter((a) => a.refunds)

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {primary.map((a) => (
          <Button key={a.to} disabled={pending} onClick={() => execute(a)}>
            {pending && <Loader2 className="animate-spin" />}
            {a.label}
          </Button>
        ))}
        {destructive.map((a) => (
          <Button key={a.to} variant="outline" disabled={pending} onClick={() => setConfirming(a)}>
            {a.label}
          </Button>
        ))}
      </div>

      <Dialog open={!!confirming} onOpenChange={(open) => !open && setConfirming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirming?.label}?</DialogTitle>
            <DialogDescription>This can&apos;t be undone. The customer is refunded in full automatically.</DialogDescription>
          </DialogHeader>
          {withNote && (
            <div className="space-y-1.5">
              <Label htmlFor="transition-note">Reason (shared with the customer)</Label>
              <Textarea id="transition-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} rows={3} />
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirming(null)} disabled={pending}>
              Keep it
            </Button>
            <Button variant="destructive" disabled={pending} onClick={() => confirming && execute(confirming, note)}>
              {pending && <Loader2 className="animate-spin" />}
              {confirming?.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
