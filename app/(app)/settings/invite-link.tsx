"use client"

import { useEffect, useState } from "react"
import { Check, Copy, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function InviteLink({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  // The full URL needs the browser's origin; set it after mount so server and client render the same first.
  const [origin, setOrigin] = useState("")
  useEffect(() => setOrigin(window.location.origin), [])
  const link = `${origin}/register?ref=${code}`
  const text = "I use DiasporaConnect to pay bills and send gifts to family in Kosovo. Join with my link and we both get €5:"
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input readOnly value={link} aria-label="Your invite link" onFocus={(e) => e.target.select()} />
        <Button
          type="button"
          variant="outline"
          onClick={async () => {
            await navigator.clipboard.writeText(link)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }}
        >
          {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <Button asChild variant="secondary" size="sm">
        <a href={`https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}`} target="_blank" rel="noreferrer">
          <Share2 /> Share on WhatsApp
        </a>
      </Button>
    </div>
  )
}
