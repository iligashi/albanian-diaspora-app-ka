import mongoose from "mongoose"

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recipient: {
    name: {
      type: String,
      required: true,
    },
    phone: String,
    address: {
      type: String,
      required: true,
    },
    familyMemberId: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  billType: {
    type: String,
    enum: ["electricity", "water", "rent", "internet", "phone", "gas", "other"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01,
  },
  currency: {
    type: String,
    enum: ["EUR", "USD", "GBP"],
    default: "EUR",
  },
  description: String,
  paymentMethod: {
    type: String,
    enum: ["card", "bank_transfer", "paypal", "stripe"],
    default: "card",
  },
  status: {
    type: String,
    enum: ["pending", "processing", "completed", "failed", "cancelled"],
    default: "pending",
  },
  transactionId: {
    type: String,
    unique: true,
  },
  stripePaymentIntentId: String,
  paymentDate: Date,
  completedAt: Date,
  failureReason: String,
  fees: {
    type: Number,
    default: 0,
  },
  netAmount: Number,
  receipt: {
    url: String,
    filename: String,
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Generate transaction ID before saving
paymentSchema.pre("save", function (next) {
  if (!this.transactionId) {
    this.transactionId = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  }

  // Calculate net amount (amount - fees)
  this.netAmount = this.amount - (this.fees || 0)

  this.updatedAt = new Date()
  next()
})

// Index for better query performance
paymentSchema.index({ user: 1, createdAt: -1 })
paymentSchema.index({ status: 1 })
paymentSchema.index({ transactionId: 1 })

export default mongoose.models.Payment || mongoose.model("Payment", paymentSchema)
