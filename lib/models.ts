import mongoose, { Schema, type InferSchemaType, type Model, type Types } from "mongoose"
import {
  BILL_PROVIDER_IDS,
  CITIES,
  GIFT_CATEGORIES,
  RELATIONSHIPS,
  SERVICE_CATEGORIES,
  TIME_SLOTS,
  VENDOR_KINDS,
} from "./domain/catalog"
import { BILL_STATUSES, BOOKING_STATUSES, GIFT_STATUSES } from "./domain/workflow"

/**
 * All money fields are integer cents (EUR). Orders keep a snapshot of the
 * recipient and line items so history stays correct if those are edited later.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function model<S extends Schema<any, any, any, any, any, any, any, any>>(name: string, schema: S) {
  type Doc = InferSchemaType<S>
  return (mongoose.models[name] ?? mongoose.model(name, schema)) as Model<Doc>
}

export const ROLES = ["customer", "vendor", "admin"] as const
export type Role = (typeof ROLES)[number]

// ---------------------------------------------------------------- users

const userSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 60 },
    lastName: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: "customer", required: true },
    phone: { type: String, trim: true },
    country: { type: String, trim: true },
    status: { type: String, enum: ["active", "disabled"], default: "active", required: true },
    lastLoginAt: Date,
  },
  { timestamps: true },
)
export type UserDoc = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId }
export const User = model("User", userSchema)

// ---------------------------------------------------------------- recipients (family in Kosovo)

const recipientSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    relationship: { type: String, enum: RELATIONSHIPS, required: true },
    phone: { type: String, trim: true },
    city: { type: String, enum: CITIES, required: true },
    addressLine: { type: String, required: true, trim: true, maxlength: 200 },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true },
)
export type RecipientDoc = InferSchemaType<typeof recipientSchema> & { _id: Types.ObjectId }
export const Recipient = model("Recipient", recipientSchema)

const recipientSnapshot = new Schema(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: "Recipient" },
    fullName: { type: String, required: true },
    phone: String,
    city: { type: String, required: true },
    addressLine: { type: String, required: true },
  },
  { _id: false },
)

const eventSchema = new Schema(
  {
    status: { type: String, required: true },
    actor: { type: String, enum: ["customer", "vendor", "admin", "system"], required: true },
    note: String,
    at: { type: Date, default: () => new Date() },
  },
  { _id: false },
)

// ---------------------------------------------------------------- vendors and their catalog

const vendorSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    businessName: { type: String, required: true, trim: true, maxlength: 120 },
    kind: { type: String, enum: VENDOR_KINDS, required: true },
    description: { type: String, trim: true, maxlength: 1000 },
    phone: { type: String, required: true, trim: true },
    city: { type: String, enum: CITIES, required: true },
    serviceCities: [{ type: String, enum: CITIES }],
    status: { type: String, enum: ["pending", "approved", "suspended"], default: "pending", required: true, index: true },
    reviewNote: { type: String, trim: true },
    approvedAt: Date,
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true },
)
export type VendorDoc = InferSchemaType<typeof vendorSchema> & { _id: Types.ObjectId }
export const Vendor = model("Vendor", vendorSchema)

const productSchema = new Schema(
  {
    vendor: { type: Schema.Types.ObjectId, ref: "Vendor", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000 },
    category: { type: String, enum: GIFT_CATEGORIES, required: true },
    priceCents: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
)
productSchema.index({ category: 1, active: 1 })
export type ProductDoc = InferSchemaType<typeof productSchema> & { _id: Types.ObjectId }
export const Product = model("Product", productSchema)

const offeringSchema = new Schema(
  {
    vendor: { type: Schema.Types.ObjectId, ref: "Vendor", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000 },
    category: { type: String, enum: SERVICE_CATEGORIES, required: true },
    priceCents: { type: Number, required: true, min: 0 },
    durationMinutes: { type: Number, min: 15 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
)
offeringSchema.index({ category: 1, active: 1 })
export type OfferingDoc = InferSchemaType<typeof offeringSchema> & { _id: Types.ObjectId }
export const Offering = model("Offering", offeringSchema)

// ---------------------------------------------------------------- orders

const billSchema = new Schema(
  {
    reference: { type: String, required: true, unique: true },
    customer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    recipient: { type: recipientSnapshot, required: true },
    provider: { type: String, enum: BILL_PROVIDER_IDS, required: true },
    accountNumber: { type: String, required: true, trim: true },
    period: { type: String, trim: true },
    amountCents: { type: Number, required: true, min: 1 },
    feeCents: { type: Number, required: true, min: 0 },
    totalCents: { type: Number, required: true, min: 1 },
    status: { type: String, enum: BILL_STATUSES, required: true, index: true },
    settlementReference: String,
    settledAt: Date,
    events: [eventSchema],
  },
  { timestamps: true },
)
export type BillDoc = InferSchemaType<typeof billSchema> & { _id: Types.ObjectId }
export const Bill = model("Bill", billSchema)

const giftOrderSchema = new Schema(
  {
    reference: { type: String, required: true, unique: true },
    customer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    vendor: { type: Schema.Types.ObjectId, ref: "Vendor", required: true, index: true },
    recipient: { type: recipientSnapshot, required: true },
    items: [
      {
        _id: false,
        product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        name: { type: String, required: true },
        unitPriceCents: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1, max: 20 },
      },
    ],
    subtotalCents: { type: Number, required: true },
    feeCents: { type: Number, required: true },
    totalCents: { type: Number, required: true },
    message: { type: String, trim: true, maxlength: 500 },
    deliveryDate: { type: Date, required: true },
    status: { type: String, enum: GIFT_STATUSES, required: true, index: true },
    events: [eventSchema],
  },
  { timestamps: true },
)
export type GiftOrderDoc = InferSchemaType<typeof giftOrderSchema> & { _id: Types.ObjectId }
export const GiftOrder = model("GiftOrder", giftOrderSchema)

const bookingSchema = new Schema(
  {
    reference: { type: String, required: true, unique: true },
    customer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    vendor: { type: Schema.Types.ObjectId, ref: "Vendor", required: true, index: true },
    offering: { type: Schema.Types.ObjectId, ref: "Offering", required: true },
    offeringTitle: { type: String, required: true },
    category: { type: String, enum: SERVICE_CATEGORIES, required: true },
    recipient: { type: recipientSnapshot, required: true },
    date: { type: Date, required: true },
    timeSlot: { type: String, enum: TIME_SLOTS, required: true },
    notes: { type: String, trim: true, maxlength: 1000 },
    priceCents: { type: Number, required: true },
    feeCents: { type: Number, required: true },
    totalCents: { type: Number, required: true },
    status: { type: String, enum: BOOKING_STATUSES, required: true, index: true },
    review: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String, trim: true, maxlength: 1000 },
      createdAt: Date,
    },
    events: [eventSchema],
  },
  { timestamps: true },
)
export type BookingDoc = InferSchemaType<typeof bookingSchema> & { _id: Types.ObjectId }
export const Booking = model("Booking", bookingSchema)

// ---------------------------------------------------------------- money movements

export const SUBJECT_KINDS = ["bill", "gift", "booking"] as const
export type SubjectKind = (typeof SUBJECT_KINDS)[number]

const transactionSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subjectKind: { type: String, enum: SUBJECT_KINDS, required: true },
    subjectId: { type: Schema.Types.ObjectId, required: true },
    subjectReference: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, enum: ["charge", "refund"], required: true },
    amountCents: { type: Number, required: true },
    provider: { type: String, required: true },
    providerReference: String,
    status: { type: String, enum: ["succeeded", "failed"], required: true },
    failureReason: String,
  },
  { timestamps: true },
)
transactionSchema.index({ subjectKind: 1, subjectId: 1 })
export type TransactionDoc = InferSchemaType<typeof transactionSchema> & { _id: Types.ObjectId }
export const Transaction = model("Transaction", transactionSchema)

// ---------------------------------------------------------------- notifications

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    href: String,
    readAt: Date,
  },
  { timestamps: true },
)
notificationSchema.index({ user: 1, createdAt: -1 })
export type NotificationDoc = InferSchemaType<typeof notificationSchema> & { _id: Types.ObjectId }
export const Notification = model("Notification", notificationSchema)
