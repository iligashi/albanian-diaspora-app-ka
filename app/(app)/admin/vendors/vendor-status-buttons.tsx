"use client"

import { useState, useTransition } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { setVendorStatusAction } from "../actions"

export function VendorStatusButtons({ vendorId, status }: { vendorId: string; status: string }) {
  const [pending, startTransition] = useTransition()
  const [suspending, setSuspending] = useState(false)
  const [note, setNote] = useState("")

  const run = (next: "approved" | "suspended", reason?: string) =>
    startTransition(async () => {
      const res = await setVendorStatusAction(vendorId, next, reason)
      if (res.error) toast.error(res.error)
      else toast.success(res.message)
      setSuspending(false)
    })

  return (
    <div className="flex gap-2">
      {status !== "approved" && (
        <Button disabled={pending} onClick={() => run("approved")}>
          {pending && <Loader2 className="animate-spin" />}
          {status === "pending" ? "Approve" : "Reinstate"}
        </Button>
      )}
      {status !== "suspended" && (
        <Button variant="outline" disabled={pending} onClick={() => setSuspending(true)}>
          {status === "pending" ? "Reject" : "Suspend"}
        </Button>
      )}
      <Dialog open={suspending} onOpenChange={setSuspending}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{status === "pending" ? "Reject application" : "Suspend vendor"}</DialogTitle>
            <DialogDescription>They&apos;ll be hidden from customers and told why. Open orders are not affected.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="vendor-note">Reason (sent to the vendor)</Label>
            <Textarea id="vendor-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={300} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSuspending(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={pending} onClick={() => run("suspended", note)}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
