"use client"

import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-xl border bg-card px-6 py-16 text-center">
      <AlertTriangle className="size-8 text-destructive" />
      <h2 className="mt-4 font-semibold">This page didn&apos;t load</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">Something went wrong on our side. Your data is safe. Try again in a moment.</p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}
