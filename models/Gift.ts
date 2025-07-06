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
      required: true,
      enum: ["flowers", "cakes", "food", "electronics", "clothing", "other"],
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
    message: {
      text: String,
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
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    trackingNumber: {
      type: String,
      unique: true,
    },
    stripePaymentIntentId: String,
    deliveredAt: Date,
    review: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: String,
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

export default mongoose.models.Gift || mongoose.model("Gift", giftSchema)
