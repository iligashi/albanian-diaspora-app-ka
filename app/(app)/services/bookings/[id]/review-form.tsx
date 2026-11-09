"use client"

import { useActionState, useState } from "react"
import { Star } from "lucide-react"
import { Field, FormError, SubmitButton, useActionFeedback } from "@/components/shared/form"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { reviewBookingAction } from "../../../customer-actions"

export function ReviewForm({ bookingId }: { bookingId: string }) {
  const [state, action] = useActionState(reviewBookingAction, {})
  useActionFeedback(state)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)

  return (
    <form action={action} className="space-y-4 p-5" noValidate>
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="rating" value={rating || ""} />
      <FormError state={state} />
      <div>
        <p className="text-sm font-medium">How did it go?</p>
        <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              className="rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Star className={cn("size-7 transition-colors", n <= (hover || rating) ? "fill-amber-400 text-amber-400" : "text-border")} />
            </button>
          ))}
        </div>
        {state.fieldErrors?.rating && <p className="mt-1 text-xs font-medium text-destructive">{state.fieldErrors.rating}</p>}
      </div>
      <Field label="Comment" name="comment" error={state.fieldErrors?.comment} hint="Optional. Shared with the provider">
        <Textarea id="comment" name="comment" rows={3} maxLength={1000} />
      </Field>
      <SubmitButton pendingText="Sending…">Submit review</SubmitButton>
    </form>
  )
}
