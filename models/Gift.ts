import mongoose from "mongoose"

const giftSchema = new mongoose.Schema(
  {
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
        default: "",
      },
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
      required: true,
      enum: ["flowers", "cakes", "food", "electronics", "clothing", "books", "toys", "other"],
      default: "other",
    },
    item: {
      name: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        default: "",
      },
      price: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
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
      default: 0,
    },
    message: {
      text: {
        type: String,
        default: "",
      },
    },
    deliveryDate: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
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
    trackingNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    stripePaymentIntentId: {
      type: String,
      default: "",
    },
    deliveredAt: {
      type: Date,
    },
    review: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: {
        type: String,
        default: "",
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
  },
)

// Add indexes for better performance
giftSchema.index({ user: 1, createdAt: -1 })
giftSchema.index({ status: 1 })
giftSchema.index({ category: 1 })
giftSchema.index({ trackingNumber: 1 })

export default mongoose.models.Gift || mongoose.model("Gift", giftSchema)
