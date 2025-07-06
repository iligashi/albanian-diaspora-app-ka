import mongoose from "mongoose"

const serviceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  category: {
    type: String,
    enum: ["cleaning", "repairs", "internet_setup", "electrician", "plumbing", "gardening", "maintenance", "other"],
    required: true,
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
  familyMemberId: {
    type: mongoose.Schema.Types.ObjectId,
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
  currency: {
    type: String,
    enum: ["EUR", "USD", "GBP"],
    default: "EUR",
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
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium",
  },
  contactPerson: {
    name: String,
    phone: String,
    email: String,
  },
  serviceProvider: {
    name: String,
    phone: String,
    email: String,
    rating: Number,
    company: String,
  },
  materials: [
    {
      name: String,
      quantity: Number,
      cost: Number,
    },
  ],
  laborCost: Number,
  totalCost: Number,
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment",
  },
  images: [
    {
      url: String,
      description: String,
      type: {
        type: String,
        enum: ["before", "during", "after"],
      },
    },
  ],
  notes: String,
  completedAt: Date,
  review: {
    rating: {
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

// Calculate total cost before saving
serviceSchema.pre("save", function (next) {
  const materialsCost = this.materials?.reduce((sum, material) => sum + (material.cost || 0), 0) || 0
  this.totalCost = this.price + materialsCost + (this.laborCost || 0)
  this.updatedAt = new Date()
  next()
})

// Index for better query performance
serviceSchema.index({ user: 1, createdAt: -1 })
serviceSchema.index({ status: 1 })
serviceSchema.index({ scheduledDate: 1 })

export default mongoose.models.Service || mongoose.model("Service", serviceSchema)
