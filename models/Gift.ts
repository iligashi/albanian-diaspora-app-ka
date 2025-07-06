import mongoose from "mongoose"

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
    phone: String,
    address: {
      type: String,
      required: true,
    },
    familyMemberId: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  category: {
    type: String,
    enum: ["flowers", "cakes", "food", "electronics", "clothing", "jewelry", "books", "other"],
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
    sku: String,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    enum: ["EUR", "USD", "GBP"],
    default: "EUR",
  },
  message: {
    text: String,
    cardType: {
      type: String,
      enum: ["birthday", "anniversary", "congratulations", "sympathy", "custom"],
      default: "custom",
    },
  },
  deliveryDate: {
    type: Date,
    required: true,
  },
  deliveryTime: {
    type: String,
    enum: ["morning", "afternoon", "evening", "anytime"],
    default: "anytime",
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"],
    default: "pending",
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending",
  },
  trackingNumber: String,
  vendor: {
    name: String,
    phone: String,
    address: String,
  },
  deliveryFee: {
    type: Number,
    default: 0,
  },
  taxes: {
    type: Number,
    default: 0,
  },
  finalAmount: Number,
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment",
  },
  deliveredAt: Date,
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: String,
    createdAt: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Calculate final amount before saving
giftSchema.pre("save", function (next) {
  this.finalAmount = this.totalAmount + (this.deliveryFee || 0) + (this.taxes || 0)
  this.updatedAt = new Date()

  // Generate tracking number if status is confirmed and no tracking number exists
  if (this.status === "confirmed" && !this.trackingNumber) {
    this.trackingNumber = `GIFT_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`
  }

  next()
})

// Index for better query performance
giftSchema.index({ user: 1, createdAt: -1 })
giftSchema.index({ status: 1 })
giftSchema.index({ deliveryDate: 1 })

export default mongoose.models.Gift || mongoose.model("Gift", giftSchema)
