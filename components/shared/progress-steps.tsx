import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Horizontal progress for the happy path of an order. If the order ended
 * early (rejected, cancelled…) the remaining steps are greyed out and the
 * end state is shown instead.
 */
export function ProgressSteps({ steps, status, endedAs }: { steps: Array<{ status: string; label: string }>; status: string; endedAs?: string }) {
  const index = steps.findIndex((s) => s.status === status)
  return (
    <ol className="grid gap-3 sm:flex sm:items-start sm:gap-0">
      {steps.map((step, i) => {
        const done = index >= 0 && i <= index
        const current = i === index
        return (
          <li key={step.status} className="flex items-center gap-3 sm:flex-1 sm:flex-col sm:gap-2 sm:text-center">
            <div className="flex items-center sm:w-full">
              <span className={cn("hidden h-0.5 flex-1 sm:block", i === 0 ? "invisible" : done ? "bg-primary" : "bg-border")} />
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full border-2 text-xs font-semibold",
                  done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground",
                  current && "ring-4 ring-primary/15",
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className={cn("hidden h-0.5 flex-1 sm:block", i === steps.length - 1 ? "invisible" : i < index ? "bg-primary" : "bg-border")} />
            </div>
            <span className={cn("text-sm sm:text-xs", done ? "font-medium" : "text-muted-foreground")}>{step.label}</span>
          </li>
        )
      })}
      {endedAs && (
        <li className="flex items-center gap-3 sm:flex-1 sm:flex-col sm:gap-2 sm:text-center">
          <span className="grid size-7 place-items-center rounded-full bg-destructive text-destructive-foreground sm:mx-auto">
            <X className="size-3.5" />
          </span>
          <span className="text-sm font-medium text-destructive sm:text-xs">{endedAs}</span>
        </li>
      )}
    </ol>
  )
}
