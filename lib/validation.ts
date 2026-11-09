import { z } from "zod"
import {
  BILL_PROVIDER_IDS,
  CITIES,
  GIFT_CATEGORIES,
  RELATIONSHIPS,
  SERVICE_CATEGORIES,
  TIME_SLOTS,
  VENDOR_KINDS,
} from "./domain/catalog"
import { parseMoneyToCents } from "./money"

/** Input schemas shared by server actions. Form values arrive as strings. */

const trimmed = (max: number) => z.string().trim().max(max)
const required = (label: string, max = 200) => trimmed(max).min(1, `${label} is required`)
const optional = (max: number) =>
  trimmed(max)
    .optional()
    .transform((v) => (v ? v : undefined))
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id")
const phone = z
  .string()
  .trim()
  .regex(/^\+?[\d\s()-]{6,20}$/, "Enter a valid phone number")
const money = (label: string) =>
  z
    .string()
    .transform((v, ctx) => {
      const cents = parseMoneyToCents(v)
      if (cents === null || cents <= 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label} must be a positive amount, e.g. 24.50` })
        return z.NEVER
      }
      return cents
    })
    .pipe(z.number().max(500_000, `${label} can't exceed €5,000`))
const futureDate = (label: string, minDaysAhead: number) =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `Choose a ${label.toLowerCase()}`)
    .transform((v) => new Date(`${v}T12:00:00Z`))
    .refine((d) => {
      const earliest = new Date()
      earliest.setUTCHours(0, 0, 0, 0)
      earliest.setUTCDate(earliest.getUTCDate() + minDaysAhead)
      return d >= earliest
    }, minDaysAhead === 0 ? `${label} can't be in the past` : `${label} must be at least ${minDaysAhead} day(s) from today`)
    .refine((d) => d.getTime() - Date.now() < 1000 * 60 * 60 * 24 * 120, `${label} must be within the next 4 months`)

const password = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(128)
  .refine((v) => /[a-zA-Z]/.test(v) && /\d/.test(v), "Use both letters and numbers")

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password").max(128),
})

export const registerSchema = z.object({
  accountType: z.enum(["customer", "vendor"]),
  firstName: required("First name", 60),
  lastName: required("Last name", 60),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password,
  country: optional(60),
})

export const vendorProfileSchema = z.object({
  businessName: required("Business name", 120),
  kind: z.enum(VENDOR_KINDS),
  phone,
  city: z.enum(CITIES, { message: "Choose a city" }),
  serviceCities: z.array(z.enum(CITIES)).min(1, "Choose at least one city you deliver to or work in"),
  description: optional(1000),
})

export const recipientSchema = z.object({
  fullName: required("Full name", 120),
  relationship: z.enum(RELATIONSHIPS, { message: "Choose a relationship" }),
  phone: phone.optional().or(z.literal("").transform(() => undefined)),
  city: z.enum(CITIES, { message: "Choose a city" }),
  addressLine: required("Address", 200),
  notes: optional(500),
})

export const billSchema = z.object({
  recipientId: objectId,
  provider: z.enum(BILL_PROVIDER_IDS, { message: "Choose a provider" }),
  accountNumber: required("Account number", 60),
  period: optional(40),
  amount: money("Amount"),
})

export const giftOrderSchema = z.object({
  productId: objectId,
  quantity: z.coerce.number().int().min(1).max(20),
  recipientId: objectId,
  deliveryDate: futureDate("Delivery date", 1),
  message: optional(500),
})

export const bookingSchema = z.object({
  offeringId: objectId,
  recipientId: objectId,
  date: futureDate("Date", 1),
  timeSlot: z.enum(TIME_SLOTS, { message: "Choose a time slot" }),
  notes: optional(1000),
})

export const reviewSchema = z.object({
  bookingId: objectId,
  rating: z.coerce.number().int().min(1, "Choose a rating").max(5),
  comment: optional(1000),
})

export const productSchema = z.object({
  name: required("Name", 120),
  category: z.enum(GIFT_CATEGORIES, { message: "Choose a category" }),
  price: money("Price"),
  description: optional(1000),
  active: z.boolean(),
})

export const offeringSchema = z.object({
  title: required("Title", 120),
  category: z.enum(SERVICE_CATEGORIES, { message: "Choose a category" }),
  price: money("Price"),
  durationMinutes: z.coerce.number().int().min(15).max(24 * 60).optional(),
  description: optional(1000),
  active: z.boolean(),
})

export const profileSchema = z.object({
  firstName: required("First name", 60),
  lastName: required("Last name", 60),
  phone: phone.optional().or(z.literal("").transform(() => undefined)),
  country: optional(60),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] })

export const settleBillSchema = z.object({
  billId: objectId,
  settlementReference: required("Provider receipt number", 80),
})

export const idSchema = objectId
