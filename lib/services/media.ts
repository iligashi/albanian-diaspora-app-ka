import "server-only"
import { Readable } from "node:stream"
import mongoose, { Types } from "mongoose"
import type { Actor } from "../domain/workflow"
import { Booking, GiftOrder, Media, Vendor, type BookingDoc, type GiftOrderDoc, type MediaDoc } from "../models"
import { AppError, notify } from "./core"
import { assertOrderAccess } from "./orders"

/**
 * Delivery photos and voice notes, stored in MongoDB GridFS so they work with
 * any MongoDB (including the in-memory dev database) without extra cloud setup.
 * Files are only ever served to the customer, the vendor and admins of the order.
 */

const LIMITS = { photo: 6 * 1024 * 1024, voice: 3 * 1024 * 1024 } as const

/** Identify the format from the file's bytes, never from the browser-supplied name or type. */
function sniff(bytes: Uint8Array): { kind: "photo" | "voice"; contentType: string } | null {
  const at = (i: number, ...sig: number[]) => sig.every((b, j) => bytes[i + j] === b)
  const ascii = (i: number, text: string) => at(i, ...[...text].map((c) => c.charCodeAt(0)))
  if (at(0, 0xff, 0xd8, 0xff)) return { kind: "photo", contentType: "image/jpeg" }
  if (at(0, 0x89, 0x50, 0x4e, 0x47)) return { kind: "photo", contentType: "image/png" }
  if (ascii(0, "RIFF") && ascii(8, "WEBP")) return { kind: "photo", contentType: "image/webp" }
  if (at(0, 0x1a, 0x45, 0xdf, 0xa3)) return { kind: "voice", contentType: "audio/webm" }
  if (ascii(0, "OggS")) return { kind: "voice", contentType: "audio/ogg" }
  if (ascii(4, "ftyp")) return { kind: "voice", contentType: "audio/mp4" }
  return null
}

export async function readUpload(file: unknown, expected: "photo" | "voice") {
  if (!(file instanceof File) || file.size === 0) return null
  if (file.size > LIMITS[expected]) throw new AppError(expected === "photo" ? "Photos can be up to 6 MB." : "Voice notes can be up to 3 MB (about a minute).")
  const buffer = Buffer.from(await file.arrayBuffer())
  const format = sniff(buffer)
  if (!format || format.kind !== expected) {
    throw new AppError(expected === "photo" ? "Upload a JPG, PNG or WebP photo." : "That voice note couldn't be read. Please record it again.")
  }
  return { buffer, contentType: format.contentType, kind: expected }
}

function bucket() {
  const db = mongoose.connection.db
  if (!db) throw new Error("Database not connected")
  return new mongoose.mongo.GridFSBucket(db, { bucketName: "media" })
}

async function store(owner: string | Types.ObjectId, upload: NonNullable<Awaited<ReturnType<typeof readUpload>>>, subject: { kind: "gift" | "booking"; id: Types.ObjectId }) {
  const fileId = new Types.ObjectId()
  await new Promise<void>((resolve, reject) => {
    Readable.from(upload.buffer)
      .pipe(bucket().openUploadStreamWithId(fileId, `${subject.kind}-${subject.id}`, { metadata: { contentType: upload.contentType } }))
      .on("finish", () => resolve())
      .on("error", reject)
  })
  return Media.create({ owner, kind: upload.kind, contentType: upload.contentType, size: upload.buffer.length, file: fileId, subjectKind: subject.kind, subjectId: subject.id })
}

export async function attachVoiceNote(customerId: string, orderId: Types.ObjectId, upload: NonNullable<Awaited<ReturnType<typeof readUpload>>>) {
  const media = await store(customerId, upload, { kind: "gift", id: orderId })
  await GiftOrder.updateOne({ _id: orderId, customer: customerId }, { $set: { voiceNote: media._id } })
  return media
}

/** Vendors add photos once the gift is on its way or the job has started; customers are notified. */
export async function addProof(user: { id: string; role: Actor }, kind: "gift" | "booking", orderId: string, upload: NonNullable<Awaited<ReturnType<typeof readUpload>>>, note?: string) {
  if (user.role !== "vendor" && user.role !== "admin") throw new AppError("Only the provider can add photos.")
  const order = kind === "gift" ? await GiftOrder.findById(orderId).lean<GiftOrderDoc>() : await Booking.findById(orderId).lean<BookingDoc>()
  if (!order) throw new AppError("Not found.")
  await assertOrderAccess(user, order)
  const allowed = kind === "gift" ? ["accepted", "out_for_delivery", "delivered"] : ["in_progress", "completed"]
  if (!allowed.includes(order.status)) throw new AppError(kind === "gift" ? "Add photos once you've accepted the order." : "Add photos once the job has started.")
  if ((order.proofPhotos?.length ?? 0) >= 6) throw new AppError("You can add up to 6 photos.")

  const media = await store(user.id, upload, { kind, id: order._id })
  const model = kind === "gift" ? GiftOrder : Booking
  await (model as typeof GiftOrder).updateOne(
    { _id: order._id },
    { $push: { proofPhotos: media._id }, ...(kind === "booking" && note ? { $set: { reportNote: note } } : {}) },
  )
  const href = kind === "gift" ? `/gifts/orders/${order._id}` : `/services/bookings/${order._id}`
  await notify(order.customer, "New photo from home", kind === "gift" ? `See ${order.recipient.fullName.split(" ")[0]}'s delivery (${order.reference}).` : `The provider shared a photo from ${order.reference}.`, href)
  return media
}

/** Opens a stored file if the user may see it. Unknown or forbidden ids look the same. */
export async function openMedia(user: { id: string; role: Actor }, mediaId: string) {
  if (!Types.ObjectId.isValid(mediaId)) return null
  const media = await Media.findById(mediaId).lean<MediaDoc>()
  if (!media) return null
  const order = media.subjectKind === "gift" ? await GiftOrder.findById(media.subjectId).select("customer vendor").lean() : await Booking.findById(media.subjectId).select("customer vendor").lean()
  if (!order) return null
  try {
    await assertOrderAccess(user, order)
  } catch {
    return null
  }
  return { media, stream: bucket().openDownloadStream(media.file) }
}

/** Vendor id for a user, used by pages that show vendor-side media. */
export async function vendorIdFor(userId: string) {
  return (await Vendor.findOne({ user: userId }).select("_id").lean())?._id ?? null
}
