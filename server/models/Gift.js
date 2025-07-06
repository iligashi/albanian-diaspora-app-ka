const mongoose = require("mongoose")

const giftSchema = new mongoose.Schema({
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
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
  },
  category: {
    type: String,
    enum: ["flowers", "cakes", "food", "electronics", "clothing", "books", "other"],
    required: true,
  },
  item: {
    name: {
      type: String,
      required: true,
    },
    description: String,
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    image: String,
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    enum: ["EUR", "USD", "GBP"],
    default: "EUR",
  },
  message: {
    text: String,
    voiceNote: String, // URL to voice note file
  },
  deliveryDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"],
    default: "pending",
  },
  trackingNumber: String,
  deliveredAt: Date,
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending",
  },
  transactionId: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Index for efficient queries
giftSchema.index({ user: 1, createdAt: -1 })
giftSchema.index({ status: 1 })
giftSchema.index({ category: 1 })

module.exports = mongoose.model("Gift", giftSchema)
