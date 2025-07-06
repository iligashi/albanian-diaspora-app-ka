import mongoose from "mongoose"

const serviceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["cleaning", "repairs", "internet_setup", "electrician", "plumbing", "gardening", "other"],
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    timeSlot: {
      start: {
        type: String,
        required: true,
      },
      end: {
        type: String,
        required: true,
      },
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "in_progress", "completed", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    contactPerson: {
      name: String,
      phone: String,
    },
    notes: String,
    stripePaymentIntentId: String,
    serviceProvider: {
      name: String,
      phone: String,
      rating: Number,
    },
    completedAt: Date,
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

export default mongoose.models.Service || mongoose.model("Service", serviceSchema)
