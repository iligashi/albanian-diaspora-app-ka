import { Camera, Mic } from "lucide-react"

/** Photos the vendor took at the door or during the visit. Served only to people on the order. */
export function ProofGallery({ photos, note, emptyText }: { photos: Array<{ toString(): string }>; note?: string | null; emptyText?: string }) {
  if (photos.length === 0 && !note) {
    return emptyText ? (
      <p className="flex items-center gap-2 px-5 py-4 text-sm text-muted-foreground">
        <Camera className="size-4" /> {emptyText}
      </p>
    ) : null
  }
  return (
    <div className="space-y-3 p-5">
      {note && <p className="rounded-lg bg-muted px-3 py-2 text-sm">{note}</p>}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((id) => (
            <a key={id.toString()} href={`/media/${id}`} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-lg border">
              {/* eslint-disable-next-line @next/next/no-img-element -- private, auth-checked file; not for the image optimizer */}
              <img src={`/media/${id}`} alt="Photo from the delivery or visit" className="aspect-square w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export function VoiceNote({ id, caption }: { id: { toString(): string }; caption: string }) {
  return (
    <div className="space-y-2 p-5">
      <p className="flex items-center gap-2 text-sm font-medium">
        <Mic className="size-4 text-primary" /> {caption}
      </p>
      <audio controls preload="none" src={`/media/${id}`} className="w-full" />
    </div>
  )
}
