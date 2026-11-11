"use client"

import { useActionState, useRef, useState } from "react"
import { Camera } from "lucide-react"
import { Field, FormError, SubmitButton, useActionFeedback } from "@/components/shared/form"
import { Textarea } from "@/components/ui/textarea"
import { uploadProofAction } from "./actions"

/** Lets the shop or provider share a photo from the door or the visit. Phones open the camera directly. */
export function ProofUpload({ kind, orderId }: { kind: "gift" | "booking"; orderId: string }) {
  const [state, action] = useActionState(uploadProofAction, {})
  const form = useRef<HTMLFormElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  useActionFeedback(state, () => {
    form.current?.reset()
    setPreview(null)
  })
  return (
    <form ref={form} action={action} className="space-y-3 p-5" noValidate>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="orderId" value={orderId} />
      <FormError state={state} />
      <Field label="Photo" name="photo" error={state.fieldErrors?.photo} hint="JPG, PNG or WebP, up to 6 MB. Ask before photographing people.">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground hover:border-foreground/30">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- local preview of the chosen file
            <img src={preview} alt="Selected photo" className="max-h-48 rounded-md object-contain" />
          ) : (
            <>
              <Camera className="size-6" />
              Take or choose a photo
            </>
          )}
          <input
            id="photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              setPreview(file ? URL.createObjectURL(file) : null)
            }}
          />
        </label>
      </Field>
      {kind === "booking" && (
        <Field label="Short report for the family" name="note" error={state.fieldErrors?.note} hint="Optional. e.g. “Your mother is well, the fridge is stocked, the heating works.”">
          <Textarea id="note" name="note" rows={3} maxLength={1000} />
        </Field>
      )}
      <SubmitButton size="sm" pendingText="Uploading…">
        Share with the family
      </SubmitButton>
    </form>
  )
}
