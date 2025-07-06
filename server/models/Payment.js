const mongoose = require("mongoose")

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
    address: {
      type: String,
      required: true,
    },
    phone: String,
    relationship: String,
  },
  billType: {
    type: String,
    enum: ["electricity", "water", "rent", "internet", "phone", "gas", "other"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, "Amount must be greater than 0"],
  },
  currency: {
    type: String,
    enum: ["EUR", "USD", "GBP"],
    default: "EUR",
  },
  description: String,
  accountNumber: String,
  referenceNumber: String,
  status: {
    type: String,
    enum: ["pending", "processing", "completed", "failed", "cancelled"],
    default: "pending",
  },
  paymentMethod: {
    type: String,
    enum: ["card", "bank_transfer", "paypal"],
    required: true,
  },
  transactionId: String,
  receiptUrl: String,
  scheduledDate: Date,
  completedAt: Date,
  failureReason: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Index for efficient queries
paymentSchema.index({ user: 1, createdAt: -1 })
paymentSchema.index({ status: 1 })

module.exports = mongoose.model("Payment", paymentSchema)
