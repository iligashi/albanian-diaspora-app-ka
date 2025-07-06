import mongoose from "mongoose"

const paymentSchema = new mongoose.Schema(
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
    },
    billType: {
      type: String,
      required: true,
      enum: ["electricity", "water", "rent", "internet", "phone", "gas", "other"],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "EUR",
      enum: ["EUR", "USD", "GBP"],
    },
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
    transactionId: {
      type: String,
      unique: true,
    },
    stripePaymentIntentId: String,
    description: String,
    completedAt: Date,
    failedReason: String,
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Payment || mongoose.model("Payment", paymentSchema)
